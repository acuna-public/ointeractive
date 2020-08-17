/*
 Toggle 1.0 - jQuery plugin
 written by O! Interactive, Acuna
 http://ointeractive.ru
 
 Copyright (c) 2020 O! Interactive, Acuna (http://ointeractive.ru)
 Dual licensed under the MIT (MIT-LICENSE.txt)
 and GPL (GPL-LICENSE.txt) licenses.
 
 Built for jQuery library
 http://jquery.com
 
 1.0  31.07.2020
  Первый приватный релиз
  
 */
  
  var opened = false;
  
  $.fn.toggle = function (options) {
    
    options = $.extend ({
      
      'elem': [],
      'class': 'active',
			
    }, options);
    
    var self = $(this);
    
    if (!$.isArray (options.elem))
      options.elem = [options.elem];
    
    $.each (options.elem, function (key, value) {
      
      self.find (value).click (function () {
        
        $.each (self.find (value), function (key, obj) {
          
          var id = $(obj).data ('toggle');
					
					if (!id)
						$($(obj).attr ('href')).hide ();
					else
						$('#' + id).hide ();
					
          // Все элементы этого типа скрываем...
					
        });
        
        var elem, id = $(this).data ('toggle');
        
				if (!id)
					elem = $($(this).attr ('href'));
				else
					elem = $('#' + id);
				
				elem.addClass (options.class);
				elem.show (); // ...а выбранный показываем
        
      });
      
    });
    
  };