/*!
 * fontSize v5.0.1 ~ Copyright (c) Ajaxson, 2017/8/1/ Email Ajaxson@163.com
 * 移动端根字节计算
 * 如有什么问题，请github 留言 或者 邮件
*/

/*
@param (psWidth) 设计稿大小, 默认640
@param (vScale)  初始 viewport scale， 默认 1,  如果页面有px，那么这个px的值 要乘以 (1/vscale), 
 				 举例，，一个10px的元素，vscale设0.5让 视图缩小一半，px不受根字节影响，不会变大，要设 20px；
@param (oldRootSize) 原始根字节大小，默认 100
@param (maxWidth) 最大自己缩放计算宽度，默认 10000px
*/

// 此方法不根据 dpr缩放viewport的 scale，，因为有的 设计师设得字体 ，会小于 极限,(骚包)看都看不到，不知你要干嘛
// 因此，你要牺牲了 直接写 1像素边的机会，，只能通过 “假伪类”，实现！
// 奄奄一息的小程序 也用的伪类，而不用dpr解决, 优点，，用到px时，不用为dpr 2， dpr3写几套的！  
// 淘宝 根据dpr，设viewport的scale，，例如6sp，把计算好后 的 ren乘以3，viewport设 0.3333333333333333,,它页面写的1px是真的 1px;
(function rootSize(o){
	
	// 储存默认数据
	var options = {
		psWidth : o.psWidth || 640,
        initialScale : o.vScale || 1,
        oldRootSize : o.oldRootSize || 100,
        maxWidth : o.maxWidth || 10000,
	}
	
    // 系统配置 初始化变量
    var fontRatio = options.oldRootSize / options.psWidth; //原始系统字体 比例，，新宽度乘以 这个比例就好
    var newWidth = 0; //新的页面宽度
    var Dpr = 1, uAgent = window.navigator.userAgent;
    var isIOS = uAgent.match(/iphone/i);
    var isYIXIN = uAgent.match(/yixin/i);
    var is2345 = uAgent.match(/Mb2345/i);
    var ishaosou = uAgent.match(/mso_app/i);
    var isSogou = uAgent.match(/sogoumobilebrowser/ig);
    var isLiebao = uAgent.match(/liebaofast/i);
    var isGnbr = uAgent.match(/GNBR/i);

    // 创建 viewport
    function _viewportCreat(sc){
		var metaObj = document.createElement("meta"); 
		metaObj.name = "viewport"; 
		metaObj.content = "width=device-width,initial-scale="+sc+", maximum-scale="+sc+", minimum-scale="+sc+", user-scalable=no";
		document.getElementsByTagName("head")[0].appendChild(metaObj);
	};
    // 字体重新计算
    function _resizeRoot(){
		var wDpr, wFsize
		// 获取dpr
        if (window.devicePixelRatio) {
            wDpr = window.devicePixelRatio;
        }else {
            wDpr = isIOS ? wWidth > 818 ? 3 : wWidth > 480 ? 2 : 1 : 1;
        }
        
        // 调用控制    
        if(isYIXIN || is2345 || ishaosou || isSogou || isLiebao || isGnbr){//YIXIN 和 2345 这里有个刚调用系统浏览器时候的bug，需要一点延迟来获取
            setTimeout(function(){
                _endDo(wDpr);
            },500);
        }else{
        	_endDo(wDpr);
        }
    }
    // 最后控制输出
    function _endDo(wDpr){
    	wWidth = (screen.width > 0) ? (window.innerWidth >= screen.width || window.innerWidth == 0) ? screen.width : window.innerWidth : window.innerWidth;
        wHeight = (screen.height > 0) ? (window.innerHeight >= screen.height || window.innerHeight == 0) ? screen.height : window.innerHeight : window.innerHeight;
        if(isIOS) {
            wWidth = screen.width;
            wHeight = screen.height;
        }
        // 是否旋转
        if(window.orientation==90||window.orientation==-90) wWidth = wHeight;
        // 是否宽大于高
        if(wWidth > wHeight) wWidth = wHeight;
        newWidth = wWidth > options.maxWidth ? options.maxWidth : wWidth;
        wFsize = newWidth * fontRatio * (1 / options.initialScale);
    	document.getElementsByTagName('html')[0].dataset.dpr = wDpr;
    	document.getElementsByTagName('html')[0].dataset.scale = options.initialScale;
        document.getElementsByTagName('html')[0].style.fontSize = wFsize + 'px';
    }
    // 调用
    _viewportCreat(options.initialScale);
    _resizeRoot();
    // 窗口大小改变后触发
    window.onresize = function(){
        _resizeRoot();
    }
}({ psWidth: 640 }) )
