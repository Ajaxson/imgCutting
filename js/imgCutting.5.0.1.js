/*!
 * imgCutting v5.0.1 ~ Copyright (c) Ajaxson, 2017/9/5/ Email Ajaxson@163.com
 * 如有什么问题，请github 留言 或者 邮件
*/

/*
@param(boxname)  		//容器名称	类型 obj/str 必填
@param(input)  	 		//文件筐名称 类型 obj/str; 必填
@param(touchObj)  		//触摸位置名称 类型 png; 默认:是容器  可选
@param(imgType)  		//输出格式 类型 png; 默认:png   可选  
@param(reduceSize)  	//输出压缩比 类型：number; 默认:0.8； 可选
@param(mixScale)  		//最小缩放 类型：number; 默认:0； 可选
@param(setCanvasWi)  	//显示的宽度 类型：number; 默认: 容器的宽度 可选
@param(setCanvasHi)  	//显示的高度 类型：number; 默认:容器的高度 可选
@param(unSupportFunc)  	//不支持文件预览回调 类型：function; 默认: 空 可选
@param(fileTypeError) 	//格式错误回调回调 类型：function; 默认: 空 可选
@param(fileChangeFunc)  //文件框改变后回调 类型：function; 默认: 空 可选
@param(fileLoadEnd)  	//文件转base64，并经过canvas处理完后回调 类型：function; 默认: 空 可选
@param(touchStartFunc)  //刚触摸时回调 类型：function; 默认: 空 可选
@param(touchMoveFunc)  	//触摸中回调 类型：function; 默认: 空 可选
@param(touchEndFunc)  	//触摸完回调 类型：function; 默认: 空 可选
@param(saveFunc)  //保存时回调 类型：function; 默认: 空 可选
@param(btnConfirm)  	//保存按钮 类型：str; 默认: 空 可选
@param(btnCancel)  	//取消按钮 类型：str; 默认: 空 可选
*/

(function(window,doc){

	pCutting  = function(options){
		var that = this;

		that.obj = typeof(options.boxname) == 'object' ? options.boxname : document.querySelector(options.boxname);  
		that.input = typeof(options.input) == 'object' ? options.input : document.querySelector(options.input);	
		// 配置参数
		that.option = {
			touchObj: options.touchObj?document.querySelector(options.touchObj) : that.obj,  //触摸层，如果不填则是显示层本身
			imgType: options.imgType || "png",	//输出类型，
			reduceSize: options.reduceSize || 0.8, //压缩比例比例
			mixScale: options.mixScale || 0, //最小缩放倍数
			// isCut: false || options.isCut,	//是否裁剪
			setCanvasWi: options.setViewWi || parseInt(that.obj.clientWidth),	//显示的宽度
			setCanvasHi: options.setViewHi || parseInt(that.obj.clientHeight),	//显示的高度
			unSupportFunc: options.unSupportFunc || '', 	//不支持文件预览回调
			fileTypeError: options.fileTypeError || '',		//格式错误回调
			fileChangeFunc: options.fileChangeFunc || '',	//文件框改变后
			fileLoadEnd: options.fileLoadEnd || '',			//文件转base64，并经过canvas处理完后
			touchStartFunc: options.touchStartFunc || '',
			touchMoveFunc: options.touchMoveFunc || null,  
			touchEndFunc: options.touchEndFunc || null,	 
			saveFunc: options.saveFunc || '',
			cancelFunc: options.cancelFunc || '',
			btnConfirm: document.querySelector(options.btnConfirm) || '', 
			btnCancel: document.querySelector(options.btnCancel) || '', 
		}
	
		// 输出参数
		that.rOption = {
			imgLen: 0,
			urls: [{yuanUrl: "", oldUrl: "", newUrl: ""}],
			translateNow: [0,0], //本次移动数组集
			translateSum: [0,0],	//本次 + 已移动的书足迹	
			translateEnd: [0,0], 	//放开后最终移动数组集
			rotateNow: 0,	//本次旋转的弧度
			rotateSum: 0,	//本次 + 已经转了的弧度	
			rotateEnd: 0, 	//放开后最终的弧度
			scaleNow: 0,	//每次移动时的 scale值
			scaleSum: 1,	//本次 + 已经移动的 scale值
			scaleEnd: 1,	//放开后的 缩放值，，初始为1；
			startTouch: [],
			moveTouch: [],
			isDouble: false  //是否是两个点
		}
		that.viewOption = {}; //此参数承载输出

		// 禁止触摸板触发保存
		that.obj.style.WebkitUserSelect = "none";
		that.option.touchObj.style.UserSelect = "none";
		// 创建一个图片
		if(!document.querySelector("#viewImg")){
			that.newItem = document.createElement("img")	
			that.newItem.id = "viewImg";	
			that.obj.insertBefore(that.newItem, that.obj.childNodes[0]);				 
			that.pic = that.obj.getElementsByTagName("img")[0];	
		}
		// 创建一个canvas
		if(!document.querySelector("#cutCanvas")){
			that.newcanvas = document.createElement("canvas");
			that.newcanvas.id = "cutCanvas";
			that.newcanvas.style.display = "none";
			that.obj.insertBefore(that.newcanvas,that.obj.childNodes[0]);	
			that.canvas = that.obj.getElementsByTagName("canvas")[0];
		}
		

		// 变量初始化
		//触摸位置宽
		that.touchWi = parseInt(that.option.touchObj.style.width);
		//触摸位置的高 
		that.touchHi = parseInt(that.option.touchObj.style.height);	
		// 触摸位置 对角长度
		that.touchLong  = ( Math.sqrt(Math.pow(that.touchWi,2) + Math.pow(that.touchHi,2)) ).toFixed(2);
		// 第几张图片
		that.i = 0;


		// 触发文件框
		that.input.click();
		// 判断图片格式
		if(typeof FileReader==='undefined'){
			that.input.setAttribute('disabled','disabled');
			// 不支持文件预览回调
			that._callBack(that.option.unSupportFunc);
			return false;
		}else{
			that.input.addEventListener('change', _readFile, false);
		}
		
		// 触发转二进制
		function _readFile(){ 
			that.rOption.imgLen = that.input.files.length;
			if(that.i < that.input.files.length){
				that.file = that.input.files[that.i]; 
				if(!/image\/\w+/.test(that.file.type)){ 
					// 文件格式不是图片
					that._callBack(option.fileTypeError);
					return false; 
				} 
				that.reader = new FileReader(); 
				that.reader.readAsDataURL(that.file); 
				that._callBack(that.option.fileChangeFunc);				
				that.reader.onload = function(e){
					that.rOption.urls[that.i] = {};
					that.rOption.urls[that.i].yuanUrl = "data:application/octet-stream;"+this.result.substr(e.target.result.indexOf("base64,"));
					that.imgbg = new Image();
					that.imgbg.src = that.rOption.urls[that.i].yuanUrl;
					that.imgbg.onload = function(){
						// 调用转base以后
						that._afterBase(that.imgbg, that.i);
						
						// 触摸图渲染好后，初始 位置
						that.pic.onload = function(){
							// 初始位置偏移
							if(that.pic.width > that.pic.height){
								if(that.pic.width > that.option.setCanvasWi){
									that.rOption.translateNow[0] = (that.option.setCanvasWi - that.pic.width) / 2;
									// 一样
									that.rOption.translateEnd[0] = that._sumTranslate(that.rOption.translateEnd, that.rOption.translateNow)[0];
									that.rOption.translateEnd[1] = that._sumTranslate(that.rOption.translateEnd, that.rOption.translateNow)[1];
									that._Transform(that.rOption.translateEnd, that.rOption.rotateEnd, that.rOption.scaleEnd);
								}
							}else{
								if(that.pic.height > that.option.setCanvasHi){
									that.rOption.translateNow[1] = (that.option.setCanvasHi - that.pic.height) / 2;
									// 一样
									that.rOption.translateEnd[0] = that._sumTranslate(that.rOption.translateEnd, that.rOption.translateNow)[0];
									that.rOption.translateEnd[1] = that._sumTranslate(that.rOption.translateEnd, that.rOption.translateNow)[1];
									that._Transform(that.rOption.translateEnd, that.rOption.rotateEnd, that.rOption.scaleEnd);
								}
							}
							that.i += 1;
							_readFile();
						}
					}
				} 
			} 
			else if(that.rOption.imgLen != 0){
				// 调用 渲染完后
				that.viewOption = JSON.parse( JSON.stringify(that.rOption) );
				var loadTime = setTimeout(function(){
					that._callBack(that.option.fileLoadEnd);
					clearTimeout(loadTime);
				},300)
				if(that.rOption.imgLen > 1){ 
					that.Refresh(); 
				}
			}
		}

		// 开始触摸
		that.option.touchObj.addEventListener("touchstart",function(e){
			e.preventDefault();
			that.rOption.startTouch = e.targetTouches;
			if(e.targetTouches.length > 1){
				that.rOption.isDouble = true;
			}
			// 回掉刚触摸
			// document.querySelector(".fix").innerHTML = e.targetTouches.length + " s";
			that._callBack(that.option.touchStartFunc);
		},false)

		// 触摸中
		that.option.touchObj.addEventListener('touchmove', function(e) {
			e.preventDefault();
			that.rOption.moveTouch = e.targetTouches;
			// 双指
			if(that.rOption.moveTouch.length > 1 && that.rOption.isDouble == true){	
				// 旋转角度
				that.rOption.rotateNow = Math.ceil( that._getAngle(that.rOption.moveTouch[0], that.rOption.moveTouch[1]) - that._getAngle(that.rOption.startTouch[0], that.rOption.startTouch[1]) );	
				that.rOption.rotateSum = that._sumAngle(that.rOption.rotateEnd, that.rOption.rotateNow) % 360; //n*360 + thisDeg 转多无谓
				// 缩放倍数	
				that.rOption.scaleNow = that._getScale(that.rOption.startTouch, that.rOption.moveTouch, that.touchLong);
				that.rOption.scaleSum = that._sumScale(that.rOption.scaleEnd, that.rOption.scaleNow);		
				that.rOption.scaleSum = that.rOption.scaleSum > that.option.mixScale? that.rOption.scaleSum : that.option.mixScale;	
				// 执行移动
				that._Transform(that.rOption.translateEnd, that.rOption.rotateSum, that.rOption.scaleSum);
			}else if(that.rOption.isDouble == false && that.rOption.moveTouch.length == 1){	
				that.rOption.translateNow[0] = that._getTranslate(that.rOption.moveTouch[0], that.rOption.startTouch[0])[0];
				that.rOption.translateNow[1] = that._getTranslate(that.rOption.moveTouch[0], that.rOption.startTouch[0])[1];
				that.rOption.translateSum[0] = that._sumTranslate(that.rOption.translateEnd, that.rOption.translateNow)[0];
				that.rOption.translateSum[1] = that._sumTranslate(that.rOption.translateEnd, that.rOption.translateNow)[1];
				// 执行移动
				that._Transform(that.rOption.translateSum, that.rOption.rotateEnd, that.rOption.scaleEnd);
			}	
			// document.querySelector(".fix").innerHTML = e.targetTouches.length + " m";	
			// 回掉触摸中
			that._callBack(that.option.touchMoveFunc);
		},false);
		
		// 触摸完，把最新的统计值给到 end
		that.option.touchObj.addEventListener("touchend",function(e){
			that.rOption.translateEnd[0] = that.rOption.translateSum[0];
			that.rOption.translateEnd[1] = that.rOption.translateSum[1];
			that.rOption.rotateEnd = that.rOption.rotateSum;
			that.rOption.scaleEnd = that.rOption.scaleSum;	
			document.querySelector(".fix").innerHTML = e.targetTouches.length + " e";	
			// 恢复是否双指 为 false
			if(e.targetTouches.length == 0){
				that.rOption.isDouble = false;
				// 回掉触摸完
				that._callBack(that.option.touchEndFunc);
			}	
		},false)

		// 保存
		if(that.option.btnConfirm){
			that.option.btnConfirm.onclick = function(){
				if(that.rOption.imgLen == 1){
					that._cuttingImg();
					that.Refresh();			
					// 回掉保存
					that._callBack(that.option.saveFunc);
				}		
			}
		}

		// 取消
		if(that.option.btnCancel){
			that.option.btnCancel.onclick = function(){
				// 还原
				that.Refresh();
				// 回掉取消
				that._callBack(that.option.cancelFunc);
			}
		}
	}


	pCutting.prototype = {
		that : this,

		// 转 base 64后 用canvas压缩大小
		// @param(imgBg) 转base 后的 图 
		_afterBase: function(imgBg,i){
			var that = this;
			that.img_wi = imgBg.width;
			that.img_hi = imgBg.height;
			if(that.img_wi > that.img_hi){
				that.img_hi = that.option.setCanvasHi;
				that.img_wi = imgBg.width / (imgBg.height / that.option.setCanvasHi);
				imgBg.width = that.img_wi;
				imgBg.height = that.img_hi;
			}else{
				that.img_wi = that.option.setCanvasWi;
				that.img_hi = imgBg.height / (imgBg.width / that.option.setCanvasWi);
				imgBg.width = that.img_wi;
				imgBg.height = that.img_hi;
			}
			that.canvas.width = that.img_wi;
			that.canvas.height = that.img_hi;
			that.ctx = that.canvas.getContext('2d');	
		 	that.ctx.clearRect (0, 0, 0, 0);
			that.ctx.drawImage(imgBg, 0, 0, that.img_wi, that.img_hi); 
			that.rOption.urls[i].oldUrl = that.canvas.toDataURL("image/"+that.option.imgType, that.option.reduceSize);
			that.pic.src = that.rOption.urls[i].oldUrl;		
		},

		//本次移动的距离
		_getTranslate: function(p1,p2){
			var x = p1.pageX - p2.pageX,
		        y = p1.pageY - p2.pageY;
		    return [x,y];
		},

		// 本次 + 已经移动的距离
		_sumTranslate: function(translateEnd, translateNow){
			return [ Math.ceil(translateEnd[0]+translateNow[0]), Math.ceil(translateEnd[1]+translateNow[1]) ];
		},

		// 计算两指拉伸距离
		_getDistance: function(p1, p2){
		    var x = p1.pageX - p2.pageX,
		        y = p1.pageY - p2.pageY;
		    return Math.sqrt((x * x) + (y * y));
		},

		// 本次缩放
		_getScale: function(startTouch,moveTouch,objLong){
			var that = this;
			var startDistance = that._getDistance(startTouch[0],startTouch[1]);
			var nowDistance = that._getDistance(moveTouch[0],moveTouch[1]);
			var nowScaleRatio = (nowDistance - startDistance) / objLong;
			return  nowScaleRatio.toFixed(3); 
		},

		// 本次+已经的缩放
		_sumScale: function(scaleEnd, scaleNow){
			scaleEnd = parseFloat(scaleEnd);
			scaleNow = parseFloat(scaleNow);
			return parseFloat( (scaleEnd + scaleNow).toFixed(3) );
		},
		
		// 计算两点夹角
		_getAngle: function(p1, p2) {
		    var x = p1.pageX - p2.pageX,
		        y = p1.pageY- p2.pageY;
		    return Math.atan2(y, x) * 180 / Math.PI;
		},

		// 本次+已经的旋转的弧度
		_sumAngle: function(rotateEnd, rotateNow){
			return Math.ceil(rotateEnd + rotateNow);
		},

		_Transform: function(ts,ro,sc){
			document.querySelector(".fix").innerHTML = "X: "+ts[0] +"  Y: " +ts[1]+ "  ROT: " +ro+ "  SCALE: "+sc;
			this.pic.style.webkitTransform = "translate3d("+ ts[0] +"px,"+ ts[1]+"px,0) "
								 		 	+ "rotate(" + ro +"deg) "
								 		 	+ "scale(" + sc +") ";				 		 		
		},

		// 裁剪
		_cuttingImg: function(){
			var that = this;
			var new_width  = that.pic.width * that.rOption.scaleEnd;	
			var new_height  = that.pic.height * that.rOption.scaleEnd;
			var new_x  = (that.pic.width - new_width) / 2 + that.rOption.translateEnd[0];		
			var new_y  = (that.pic.height - new_height) / 2 + that.rOption.translateEnd[1];
			
			that.canvas.width = that.option.setCanvasWi;
			that.canvas.height = that.option.setCanvasHi;
		 	that.ctx.clearRect (0, 0, that.option.setCanvasWi, that.option.setCanvasHi);
		 	var rtsX = new_width / 2 + new_x;	
		 	var rtsY = new_height / 2 + new_y;
		 	that.ctx.translate(rtsX,rtsY);
		 	that.ctx.rotate(that.rOption.rotateEnd*(Math.PI/180));
		 	that.ctx.translate(-rtsX,-rtsY);
			that.ctx.drawImage(that.pic, new_x, new_y, new_width, new_height); 
			that.rOption.urls[0].newUrl = that.canvas.toDataURL("image/"+that.option.imgType, 1);		
		},

		// 回调
		_callBack: function(c){
			if(c && typeof(c) == "function") c();
		},

		Refresh: function(){
			var that = this;
			that.viewOption = JSON.parse( JSON.stringify(that.rOption) ); //传给输出
			// 控制层恢复初始
			that.rOption.translateNow = [0,0];	//本次移动数组集
			that.rOption.translateSum = [0,0];	//本次 + 已移动的书足迹	
			that.rOption.translateEnd = [0,0]; 	//放开后最终移动数组集
			that.rOption.rotateNow = 0;	//本次旋转的弧度
			that.rOption.rotateSum = 0;	//本次 + 已经转了的弧度	
			that.rOption.rotateEnd = 0; 	//放开后最终的弧度
			that.rOption.scaleNow = 0;	//每次移动时的 scale值
			that.rOption.scaleSum = 1;	//本次 + 已经移动的 scale值
			that.rOption.scaleEnd = 1;	//放开后的 缩放值，，初始为1；
			// 触发
			that._Transform(that.rOption.translateEnd, that.rOption.rotateEnd, that.rOption.scaleEnd); //恢复原位
			that.input.value = "";	//清空文件筐
			that.rOption.imgLen = 0;	//图片数恢复为0
			that.i = 0;	 //第几张恢复为0
			for(var d=that.rOption.urls.length; d>0; d--){ that.rOption.urls.pop(); }
			that.rOption.urls.length = 0;
			that.pic.remove();
			that.canvas.remove();
		}
	}
})(window,document)


			
			
