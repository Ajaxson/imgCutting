/*!
 * imgCutting v5.0.1 ~ Copyright (c) Ajaxson, 2017/9/5/ Email Ajaxson@163.com
 * 如有什么问题，请github 留言 或者 邮件
*/

/*
*配置参数
@param(boxname)  		//容器名称	类型 obj/str 必填
@param(input)  	 		//文件筐名称 类型 obj/str; 必填
@param(touchObj)  		//触摸位置名称 类型 str; 默认:是容器  可选
@param(imgType)  		//输出格式 类型 str; 默认:png   可选  
@param(reduceSize)  	//输出压缩比 类型：number; 默认:0.8； 可选
@param(mixScale)  		//最小缩放 类型：number; 默认:0； 可选
//是否需要裁剪
@param(setLoadWi)  		//第一次压缩的尺寸 宽 类型：number; 默认: 照片本身尺寸 可选  
@param(setLoadHi)  		//第一次压缩的尺寸 高 类型：number; 默认:照片本身尺寸 可选
                        //如果设了宽又设高，那么看 哪个和 原图比例 大，，例如， 原图宽 / 设定宽 = 1， 原图高 /设定高=0.1  那么 宽撑满，高随便
@param(unCut)  			//是否阻止裁剪 类型：bool; 默认 false 可以裁剪， true，不裁剪: 可选
@param(setViewWi)  		//操控框的宽度 类型：number; 默认: 容器的宽度 可选
@param(setViewHi)  		//操控框高度 类型：number; 默认:容器的高度 可选
@param(unSupportFunc)  	//不支持文件预览回调 类型：function; 默认: 空 可选
@param(fileTypeError) 	//格式错误回调回调 类型：function; 默认: 空 可选
@param(fileChangeFunc)  //文件框改变后回调 类型：function; 默认: 空 可选
@param(fileLoadEnd)  	//文件转base64，并经过canvas处理完后回调 类型：function; 默认: 空 可选
@param(touchStartFunc)  //刚触摸时回调 类型：function; 默认: 空 可选
@param(touchMoveFunc)  	//触摸中回调 类型：function; 默认: 空 可选
@param(touchEndFunc)  	//触摸完回调 类型：function; 默认: 空 可选
@param(saveFunc)  		//保存时回调 类型：function; 默认: 空 可选
*/

/*
*返回参数 demo.viewOption  全部函数集合 ，以下属性 全部通过 demo.viewOption 获取
@param(imgLen)  		//图片长度	类型 number
@param(urls)  			//图片地址	类型 array，全部图片； 每个值 包含一个json{ }
						demo.urls[i].yuanUrl  图片源地址，只经过base64转码
						demo.urls[i].newUrl   图片压缩后，
						demo.urls[i].yuanUrl  图片裁剪后，只有 经过裁剪才有这属性
@param(translateSum)  	//触摸时偏移数	类型 array[x,y]
@param(translateEnd)  	//触摸完偏移数	类型 array[x,y]
@param(rotateSum)  		//触摸时旋转数	类型 number 单位 deg
@param(rotateEnd)  		//触摸时旋转数	类型 number 单位 deg
@param(scaleSum)  		//触摸时缩放倍数	类型 number
@param(scaleEnd)  		//触摸完缩放倍数	类型 number
*/

(function(window,doc){

	pCutting  = function(options){
		var that = this;

		// 容器
		that.obj = typeof(options.boxname) == 'object' ? options.boxname : document.querySelector(options.boxname);  
		// 文件筐
		that.input = typeof(options.input) == 'object' ? options.input : document.querySelector(options.input);	
		// 操作的图片
		that.pic = "";
		// canvas
		that.canvas = "";

		// 配置参数
		that.option = {
			touchObj: options.touchObj? document.querySelector(options.touchObj) : that.obj,  //触摸层，如果不填则是显示层本身
			imgType: options.imgType || "png",	//输出类型，
			reduceSize: options.reduceSize || 0.8, //压缩比例比例
			mixScale: options.mixScale>0? options.mixScale : 0 || 0, //最小缩放倍数
			setLoadWi: options.setLoadWi || '',		//第一次压缩的尺寸 宽
			setLoadHi: options.setLoadHi || '',		//第一次压缩的尺寸 高
			unCut: options.unCut || false,			//是否需要裁剪
			setViewWi: options.setViewWi || parseInt(that.obj.clientWidth),	//操控层的宽度
			setViewHi: options.setViewHi || parseInt(that.obj.clientHeight),	//操控层的高度
			setCutWi: options.setCutWi || that.option.setViewWi,          //裁剪的 宽， 不一定是最后截取的大小，高度会根据宽比例
			unSupportFunc: options.unSupportFunc || '', 	//不支持文件预览回调
			fileTypeError: options.fileTypeError || '',		//格式错误回调
			fileChangeFunc: options.fileChangeFunc || '',	//文件框改变后
			fileLoadEnd: options.fileLoadEnd || '',			//文件转base64，并经过canvas处理完后
			touchStartFunc: options.touchStartFunc || '',
			touchMoveFunc: options.touchMoveFunc || null,  
			touchEndFunc: options.touchEndFunc || null,	 
			saveFunc: options.saveFunc || '',
			cancelFunc: options.cancelFunc || '',
		}
	
		// 输出参数
		that.rOption = {
			imgLen: 0,
			urls: [{yuanUrl: "", newUrl: "", cutUrl: ""}],
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
		// 变量初始化
		//触摸位置宽
		that.touchWi = 0;
		//触摸位置的高 
		that.touchHi = 0;	
		// 触摸位置 对角长度
		that.touchLong  = 0;
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
			that.input.addEventListener('change', function(){
				// 调用创建 canvas 和 img
				that._creatEl();
				// 触发图片处理
				_readFile();
			}, false);
		}	

		// 转二进制
		function _readFile(){ 	
			that.rOption.imgLen = that.input.files.length;
			if(that.i < that.rOption.imgLen && that.rOption.imgLen != 0){
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
							// 初始位置偏移,  类似 偏移 框的 一半  再反向移图的一半
							that.rOption.translateNow[0] = (that.option.setViewWi - that.pic.width) / 2;
							that.rOption.translateNow[1] = (that.option.setViewHi - that.pic.height) / 2;
							that.rOption.translateEnd[0] = that._sumTranslate(that.rOption.translateEnd, that.rOption.translateNow)[0];
							that.rOption.translateEnd[1] = that._sumTranslate(that.rOption.translateEnd, that.rOption.translateNow)[1];
							that._Transform(that.rOption.translateEnd, that.rOption.rotateEnd, that.rOption.scaleEnd);

							// 继续执行下一张
							that.i += 1;
							_readFile();
						}
					}
				} 
			} 
			else if(that.rOption.imgLen != 0){
				// 调用 渲染完后
				that._returnView();
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

			//触摸位置宽
			that.touchWi = parseInt(that.option.touchObj.clientWidth);
			//触摸位置的高 
			that.touchHi = parseInt(that.option.touchObj.clientWidth);	
			// 触摸位置 对角长度
			that.touchLong  = ( Math.sqrt(Math.pow(that.touchWi,2) + Math.pow(that.touchHi,2)) ).toFixed(2);

			// 回掉刚触摸
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
			// 回掉触摸中
			that._callBack(that.option.touchMoveFunc);
		},false);
		
		// 触摸完，把最新的统计值给到 end
		that.option.touchObj.addEventListener("touchend",function(e){
			that.rOption.translateEnd[0] = that.rOption.translateSum[0];
			that.rOption.translateEnd[1] = that.rOption.translateSum[1];
			that.rOption.rotateEnd = that.rOption.rotateSum;
			that.rOption.scaleEnd = that.rOption.scaleSum;	
			// 恢复是否双指 为 false
			if(e.targetTouches.length == 0){
				that.rOption.isDouble = false;
				// 回掉触摸完
				that._callBack(that.option.touchEndFunc);
			}	
		},false)
	}


	pCutting.prototype = {
		that : this,

		_creatEl: function(){
			var that = this;
			// 创建一个图片
			that.pic = that.obj.querySelector(".viewImg");
			if(that.pic == null){
				that.newItem = document.createElement("img")	
				that.newItem.className = "viewImg";	
				that.obj.insertBefore(that.newItem, that.obj.childNodes[0]);				 
				// that.pic = that.obj.getElementsByTagName("img")[0];	
				that.pic = that.obj.querySelector(".viewImg");	
			}

			// 创建一个canvas
			that.canvas = that.obj.querySelector(".cutCanvas");
			if(that.canvas == null){
				that.newcanvas = document.createElement("canvas");
				that.newcanvas.className = "cutCanvas";
				that.newcanvas.style.display = "none";
				that.obj.insertBefore(that.newcanvas,that.obj.childNodes[0]);	
				// that.canvas = that.obj.getElementsByTagName("canvas")[0];
				that.canvas = that.obj.querySelector(".cutCanvas");
			}
		},

		// 转 base 64后 用canvas压缩大小
		// @param(imgBg) 转base 后的 图 
		_afterBase: function(imgBg,i){
			var that = this;
			that.img_wi = imgBg.width;
			that.img_hi = imgBg.height;
			// 如果不需要裁剪 或者多图
			if(that.option.unCut == true || that.rOption.imgLen > 1){
				// 自定义了压缩 宽
				if(that.option.setLoadWi && !that.option.setLoadHi){
					that.img_wi = that.option.setLoadWi;
					that.img_hi = imgBg.height / (imgBg.width / that.img_wi);
				}
				// 自定义了压缩高
				else if(!that.option.setLoadWi && that.option.setLoadHi){
					that.img_hi = that.option.setLoadHi;
					that.img_wi = imgBg.width / (imgBg.height / that.img_hi);
				}
				// 都设，按哪个大来
				else if(that.option.setLoadWi && that.option.setLoadHi){
					if(that.img_wi / that.option.setLoadWi > that.img_hi / that.option.setLoadHi){
						that.img_wi = that.option.setLoadWi
						that.img_hi = imgBg.height / (imgBg.width / that.img_wi);
					}else{
						that.img_hi = that.option.setLoadHi;
						that.img_wi = imgBg.width / (imgBg.height / that.img_hi);
					}
				}
			}else{
				// 如果要裁剪，通过缩放，把页面 填满
				if(that.img_wi / that.option.setViewWi < that.img_hi / that.option.setViewHi){
					var loadScale = that.img_wi / that.option.setViewWi;
				}else{
					var loadScale = that.img_hi / that.option.setViewHi;
				}
				that.rOption.scaleSum = parseFloat((that.rOption.scaleEnd / loadScale).toFixed(2));
				that.rOption.scaleEnd = that.rOption.scaleSum;
			}

			imgBg.width = that.img_wi;
			imgBg.height = that.img_hi;
			that.canvas.width = that.img_wi;
			that.canvas.height = that.img_hi;
			that.ctx = that.canvas.getContext('2d');	
		 	that.ctx.clearRect (0, 0, 0, 0);
			that.ctx.drawImage(imgBg, 0, 0, that.img_wi, that.img_hi); 
			that.rOption.urls[i].newUrl = that.canvas.toDataURL("image/"+that.option.imgType, that.option.reduceSize);
			that.pic.src = that.rOption.urls[i].newUrl;		
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
			var nowScaleRatio = (nowDistance - startDistance) / objLong * 1;
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
			var that = this;
			document.querySelector(".fix").innerHTML = "X: "+ts[0] +"  Y: " +ts[1]+ "  ROT: " +ro+ "  SCALE: "+sc;
			that.pic.style.webkitTransform = "translate3d("+ ts[0] +"px,"+ ts[1]+"px,0) "
								 		 	+ "rotate(" + ro +"deg) "
								 		 	+ "scale(" + sc +") ";				 		 		
		},

		// 裁剪
		_cuttingImg: function(){
			var that = this;
			var cutRatio = that.setCutWi / that.setViewWi;   //截取和可视的比例
			var new_width  = that.pic.width * that.rOption.scaleEnd;	
			var new_height  = that.pic.height * that.rOption.scaleEnd;
			var new_x  = (that.pic.width - new_width) / 2 + that.rOption.translateEnd[0];		
			var new_y  = (that.pic.height - new_height) / 2 + that.rOption.translateEnd[1];
			
			that.canvas.width = that.option.setViewWi;
			that.canvas.height = that.option.setViewHi;
		 	that.ctx.clearRect (0, 0, that.option.setViewWi, that.option.setViewHi);
		 	var rtsX = new_width / 2 + new_x;	
		 	var rtsY = new_height / 2 + new_y;
		 	that.ctx.translate(rtsX,rtsY);
		 	that.ctx.rotate(that.rOption.rotateEnd*(Math.PI/180));
		 	that.ctx.translate(-rtsX,-rtsY);
			that.ctx.drawImage(that.pic, new_x, new_y, new_width, new_height); 
			that.rOption.urls[0].cutUrl = that.canvas.toDataURL("image/"+that.option.imgType, 1);		
		},

		// 返回给外部
		_returnView: function(){
			var that = this;
			that.viewOption = JSON.parse( JSON.stringify(that.rOption) ); //传给输出
		},

		// 回调
		_callBack: function(c){
			if(c && typeof(c) == "function") c();
		},

		// 调用保存
		callSaveCutting: function(){
			var that = this;
			if(that.rOption.imgLen == 1){
				that._cuttingImg();
				that._returnView();
				that.Refresh();		
				// 回掉保存
				that._callBack(that.option.saveFunc);
			}	
		},

		// 调用取消
		callCancelCutting: function(){
			var that = this;
			// 还原
			that.Refresh();
			// 回掉取消
			that._callBack(that.option.cancelFunc);	
		},

		Refresh: function(){
			var that = this;
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
			// 清除元素
			that.pic.remove();
			that.canvas.remove();	
		},

	}
})(window,document)


			
			
