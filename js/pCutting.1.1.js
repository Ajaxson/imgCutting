/*!
 * headpic v4.2.5 ~ Copyright (c) Ajaxson, 2015/10/21/ Email 3156151@163.com
*/

(function(window,doc){

	pCutting  = function(boxname,options){
		var that = this;

		that.obj = typeof boxname == 'object' ? boxname : document.querySelector(boxname);  
		that.input = typeof input == 'object' ? input : document.querySelector(input);
		
		// that.obj.style.overflow = 'hidden';		
		// 创建一个图片
		that.newItem = document.createElement("img")		
		that.obj.insertBefore(that.newItem,that.obj.childNodes[0]);				 
		that.pic = that.obj.getElementsByTagName("img")[0];	
		// 创建一个canvas
		that.newcanvas = document.createElement("canvas");
		that.newcanvas.id = "cutCanvas";
		that.newcanvas.style.display = "none";
		that.obj.insertBefore(that.newcanvas,that.obj.childNodes[0]);	
		that.canvas = that.obj.getElementsByTagName("canvas")[0];
		
		// 配置参数
		that.option = {
			touchObj: document.querySelector(options.touchObj), 
			imgType: "png" || options.imgType,	//输出类型，
			reduceSize: 0.8 || options.reduceSize, //压缩比例比例
			isCut: false || options.isCut,	//是否裁剪
			setCanvasWi: options.setCanvasWi || 640,
			setCanvasHi: options.setCanvasHi || 640,	
			unSupportFunc: options.unSupportFunc || '', 	//不支持文件预览
			fileTypeError: options.fileTypeError || '',		//格式错误回调
			fileChangeFunc: options.fileChangeFunc || '',	//文件框改变后
			fileLoadEnd: options.fileLoadEnd || '',	
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
			urls: {'yuanUrl': "", 'oldUrl': "", 'newUrl': ""},
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
			isDouble: false,  //是否是两个点
		}

		// 形参，可变参数
		//触摸位置宽
		that.touchWi = parseInt(that.option.touchObj.style.width);
		//触摸位置的高 
		that.touchHi = parseInt(that.option.touchObj.style.height);	
		// 触摸位置 对角长度
		that.touchLong  = ( Math.sqrt(Math.pow(that.touchWi,2) + Math.pow(that.touchHi,2)) ).toFixed(2);


		
		// 判断图片格式
		if(typeof FileReader==='undefined'){
			alert("抱歉，你的浏览器不支持本地预览，请按提交按钮直接上传");
			that.input.setAttribute('disabled','disabled');
			// 不支持文件预览回调
			that._callBack(that.option.unSupportFunc);
		}else{
			that.input.addEventListener('change', _readFile, false);
		}
		
		// 触发转二进制
		function _readFile(){ 
			// var that = this;
			that.file = input.files[0]; 
			if(!/image\/\w+/.test(that.file.type)){ 
				// 文件格式不是图片
				that._callBack(option.fileTypeError);
				return false; 
			} 
			that.reader = new FileReader(); 
			that.reader.readAsDataURL(that.file); 

			that._callBack(that.option.fileChangeFunc);
			that.reader.onload = function(e){
				that.rOption.urls.yuanUrl = "data:application/octet-stream;"+this.result.substr(e.target.result.indexOf("base64,"));
				that.imgbg = new Image();
				that.imgbg.src = that.rOption.urls.yuanUrl ;
				that.imgbg.onload = function(){

					that.img_wi = that.imgbg.width;
					that.img_hi = that.imgbg.height;
					if(that.img_wi > that.img_hi){
						that.img_hi = that.option.setCanvasHi;
						that.img_wi = that.imgbg.width / (that.imgbg.height / that.option.setCanvasHi);
						that.imgbg.width = that.img_wi;
						that.imgbg.height = that.img_hi;
					}else{
						that.img_wi = that.option.setCanvasWi;
						that.img_hi = that.imgbg.height / (that.imgbg.width / that.option.setCanvasWi);
						that.imgbg.width = that.img_wi;
						that.imgbg.height = that.img_hi;
					}
					that.canvas.width = that.img_wi;
					that.canvas.height = that.img_hi;
					that.ctx = that.canvas.getContext('2d');	
				 	that.ctx.clearRect (0, 0, 0, 0);
					that.ctx.drawImage(that.imgbg, 0, 0, that.img_wi, that.img_hi); 
					that.rOption.urls.oldUrl = that.canvas.toDataURL("image/png",0.5);
					that.pic.src = that.rOption.urls.oldUrl;		
					that._callBack(that.option.fileLoadEnd);	//加载完后

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
						if(options.touchLoadEnd && typeof(options.touchLoadEnd) === "function"){
							var loadTime = setTimeout(function(){
									options.touchLoadEnd();
									clearTimeout(loadTime);
							},300)
						}
					}
				}
			} 
		}

		// 开始触摸
		that.obj.addEventListener("touchstart",function(e){
			e.preventDefault();
			that.rOption.startTouch = e.targetTouches;
			if(e.targetTouches.length > 1){
				that.rOption.isDouble = true;
			}
			// 回掉刚触摸
			that._callBack(that.option.touchStartFunc);
		},false)

		// 触摸中
		that.obj.addEventListener('touchmove', function(e) {
			e.preventDefault();
			that.rOption.moveTouch = e.targetTouches;
			// 双指
			if(that.rOption.moveTouch.length > 1 && that.rOption.isDouble == true){	
				// 旋转角度
				that.rOption.rotateNow = Math.ceil( that._getAngle(that.rOption.moveTouch[0], that.rOption.moveTouch[1]) - that._getAngle(that.rOption.startTouch[0], that.rOption.startTouch[1]) );	
				that.rOption.rotateSum = that._sumAngle(that.rOption.rotateEnd, that.rOption.rotateNow);
				// 缩放倍数	
				that.rOption.scaleNow = that._getScale(that.rOption.startTouch, that.rOption.moveTouch, that.touchLong);
				that.rOption.scaleSum = that._sumScale(that.rOption.scaleEnd, that.rOption.scaleNow);			
				// 执行移动
				that._Transform(that.rOption.translateEnd, that.rOption.rotateSum, that.rOption.scaleSum);
			}else if(that.rOption.isDouble == false){	
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
		that.obj.addEventListener("touchend",function(e){
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

		// 保存
		if(that.option.btnConfirm){
			that.option.btnConfirm.onclick = function(){
				that._cuttingImg();
				that.Refresh();			
				// 回掉保存
				that._callBack(that.option.saveFunc);
			}
		}

		// 取消
		if(that.option.btnCancel){
			that.option.btnCancel.onclick = function(){
				that.Refresh();
				// 回掉取消
				that._callBack(that.option.cancelFunc);
			}
		}
	}


	pCutting.prototype = {
		that : this,

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
			that.newUrl = that.canvas.toDataURL("image/png",1);		
		},

		// 回调
		_callBack: function(c){
			if(c && typeof(c) == "function") c();
		},

		Refresh: function(){
			var that = this;
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
			that._Transform(that.rOption.translateEnd, that.rOption.rotateEnd, that.rOption.scaleEnd);

			that.input.value = "";
			that.pic.src = "";	
		}

	}
	

})(window,document)


			
			