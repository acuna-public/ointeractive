/*
 Player 1.5 - jQuery plugin
 written by O! Interactive, Acuna
 http://ointeractive.ru
 
 Copyright (c) 2014-2015, 2017, 2019 O! Interactive, Acuna (http://ointeractive.ru)
 Dual licensed under the MIT (MIT-LICENSE.txt)
 and GPL (GPL-LICENSE.txt) licenses.
 
 Built for jQuery library
 http://jquery.com
 
 Dependencies: jquery.ui.slider, jquery.marquee, jquery.prettyAjax, jquery.cookie
 
 1.0  24.10.2014
  Первый приватный релиз
  
 1.1  20.04.2015
  Некоторые исправления
  
 1.2  29.10.2015
  При изменении размера окна браузера осуществляется ресайз элемента в опции resizeElem
  
 1.3  16.12.2015
  Реализована возможность воспроизведения через флеш в браузерах, не имеющих поддержки тега <audio>
  
 1.4  07.01.2017
  + Поддержка сторонних тем оформления
  + Возможность проигрывания музыки из нескольких плееров на странице
  + Кнопки "Вперед", "Назад"
  + Вывод времени с начала композиции
  + Возможность вывода плейлиста
  
 1.5  13.09.2019
  + Громкость сохраняется в cookies
  + Колбек при достижении определенного времени прослушивания в процентах
  
 */
  
  $.fn.player = function (options) {
    
    options = $.extend ({
      
      'method': 'get',
      'data': {},
      'otherData': {},
      'timeout': 10000,
      'cache': true,
      'resizeElem': '.seek',
      'theme': 'default',
      'url': '',
      
      'volume': 100,
      'listenEndPercent': 90,
      
      'swfLocation': 'player.swf',
      'swfError': function () {},
      
      'ajaxTimeout': 10000,
      'ajaxAttemptsNum': 5,
      'ajaxSleepTime': 2,
      
      'ajaxBeforeSend': function () {},
      'ajaxComplete': function () {},
      
      'error': function () {},
      'ajaxError': function (xhr, textStatus, errorThrown) {},
      'cantPlayError': function () {},
      
      'init': function (elem, action) {},
      'complete': function () {},
      'play': function () {},
      'ended': function () {},
      'stop': function () {},
      'resume': function () {},
      'close': function () {},
      'next': function () {},
      
    }, options);
    
    if ($.cookie ('volume') > 0) options.volume = $.cookie ('volume');
    
    var player = {
      
      elem: $(this),
      almostEnd: false,
      autoSeek: true,
      prev: null,
      
      change: function (elem, find, replace, debug) {
        
        var area = '<div class="button ' + replace + '"></div>';
        if (debug) alert (area);
        
        elem.find ('.' + find).replaceWith (area);
        
      },
      
      ajax: function (action, success, i, error) {
        
        if (!success) success = options[action];
        if (!i) i = 0;
        
        if (!error) error = function (xhr, textStatus, errorThrown) {
          ++i;
          
          if (i >= options.ajaxAttemptsNum) {
            
            player.change ($(options.element), 'pause', 'play');
            options.ajaxError (xhr, textStatus, errorThrown);
            
            $(options.element).find ($('.player .play')).click (function () {
              
              player.init ($(this), 'play');
              return false;
              
            });
            
          } else {
            
            sleep (options.ajaxSleepTime * 1000);
            player.ajax (action, success, i, error);
            
          }
          
        };
        
        options.data.area = action;
        
        $.prettyAjax (options.ajaxUrl, options.data, success, {
          
          method: options.method,
          timeout: options.ajaxTimeout,
          error: error,
          beforeSend: options.ajaxBeforeSend,
          complete: options.ajaxComplete,
          
        });
        
      },
      
      showMarquee: function (marquee) {
        
        if ($.isFunction ('marquee'))
        marquee.marquee ({
          
          allowCss3Support: true,
          css3easing: 'linear',
          easing: 'linear',
          delayBeforeStart: 1000,
          direction: 'left',
          duplicated: true,
          duration: 5,
          gap: 0,
          pauseOnCycle: false,
          pauseOnHover: true,
          
        });
        
      },
      
      createAudio: function (elem, id) {
        
        elem.setAttribute ('id', id);
        elem.setAttribute ('preload', 'none');
        
      },
      
      createSource: function (elem, url) {
        
        elem.setAttribute ('src', url);
        elem.setAttribute ('type', 'audio/mpeg');
        
      },
      
      createFlash: function (id) {
        
        var
          movie = options.swfLocation + '?type=' + options.type + '&datetime=' + ( + new Date + Math.random ());
        
        return '\
<object\
  classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"\
  id="' + id + '-object"\
  width="1" height="1"\
  style="position:absolute; left:-1px;"\
/>\
  <param name="movie" value="' + movie + '"/>\
  <param name="allowscriptaccess" value="always" />\
  <embed\
    name="' + id + '-object"\
    src="' + movie + '"\
    loop="false" quality="high"\
    allowscriptaccess="always"\
    width="1" height="1"\
  />\
</object>';
        
      },
      
      getFlash: function (id) {
        return getFlash ('song-' + id + '-object');
      },
      
      isPlaying: function (song) {
        return (
          song.currentTime > 0 &&
          !song.paused &&
          !song.ended &&
          song.readyState > 2
        );
      },
      
      createSong: function () {
        
        var
          audio = document.createElement ('audio'),
          source = document.createElement ('source'),
          //wrapper = document.createElement ('div'),
          url = options.url,
          newElement = audio.cloneNode (true),
          canPlay = (options.canPlay && newElement.outerHTML),
          id = 'player-id-' + options.data.data['player-id'];
        
        if (canPlay) {
          
          doc = document;
          player.createAudio (audio, id, url);
          
        } else {
          
          var
            fragment = document.createDocumentFragment (),
            doc = fragment.createElement ? fragment : document;
          
          var subAudio = doc.createElement ('audio');
          player.createAudio (subAudio, id, url);
          
        }
        
        if (!canPlay && hasFlash ()) {
          
          var div = doc.createElement ('div');
          
          fragment.appendChild (div);
          div.innerHTML = subAudio.outerHTML;
          newElement = div.firstChild;
          
          wrapper.appendChild (newElement);
          
          wrapper.innerHTML = player.createFlash (id);
          newElement = wrapper.firstChild;
          
          wrapper.appendChild (newElement);
          
          player.createSource (source, url);
          subAudio.appendChild (source);
          
          wrapper.appendChild (subAudio);
          
        } else {
          
          player.createSource (source, url);
          audio.appendChild (source);
          
        }
        
        document.body.appendChild (audio);
        
        player.prev = options.data.data['player-id'];
        
        return document.getElementById (id);
        
      },
      
      setTitle: function (action) {
        
        if (options.canPlay || player.getFlash (options.data.data['player-id']))
          document.title = "\u25b6 " + options.answer.success.artist + '   —  ' + options.answer.success.title;
        
      },
      
      resetTitle: function (action) {
        
        if (options.canPlay || player.getFlash (options.data.data['player-id']))
        document.title = document.title.substring (2);
        
      },
      
      prepVolume: function (vol) {
        return (vol / 100);
      },
      
      checkSongEnded: function (song, value) {
        
        if (!player.almostEnd && player.autoSeek && prop (value, song.duration) >= options.listenEndPercent) {
          
          player.almostEnd = true;
          player.ajax ('ended');
          
        }
        
      },
      
      play: function (elem, action, song) { // Нажимаем play
        
        options.canPlay = player.canPlay ();
        
        if (!song || !song.length) {
          
          if (player.prev) player.init ($('.player-' + player.prev), 'next', document.getElementById ('player-id-' + player.prev), true); // Закрываем предыдущий плеер
          
          song = player.createSong ();
          
        }
        
        // Инициализируем все контролы на текущем плеере:
        
        var
          volume = elem.find ('.volume').slider ('value'),
          index = player.getElementId (options.element, options.data.data['player-id']);
        
        player.setTitle (action);
        
        player.song = song;
        player.url = options.url;
        
        player.change (elem, 'play', 'pause');
        
        /*$.each (options.otherElems, function (key, value) {
          
          var self = $(value);
          
          self.find ($('.playlist .play')).click (function () {
            
            var el = $(this).parent ();
            
            if (el.length) {
              
              player.change (el, 'play', 'pause');
              //player.init ($('.player-' + el.data ('player-id')), 'play');
              
              self.find ($('.playlist .selected')).removeClass ('selected');
              self.find (el).addClass ('selected');
              
            }
            
            return false;
            
          });
          
        });*/
        
        if (canPlay) { // Тег <audio> поддерживается
          
          song.load ();
          if (!player.isPlaying (song)) song.play ();
          
          song.volume = player.prepVolume (volume);
          song.currentTime = elem.find ('.seek').slider ('value'); // [BUG]
          
          var playHTML = function (elem) {
            
            player.checkSongEnded (song, song.currentTime);
            var time = player.songTime (song.currentTime);
            
            elem.find ('.seek').slider ({
              
              range: 'min',
              value: time[0],
              max: song.duration,
              
              slide: function (e, ui) { // Перематываем вручную
                
                //player.autoSeek = false; // Отключаем коллбек того, что песня заканчивается для предотвращения накруток прослушиваний при перемотке вручную
                song.currentTime = ui.value;
                
              }
              
            });
            
            elem.find ('.time').text (time[1] + ':' + time[2]);
            
          };
          
          $(song).on ('timeupdate', function () { // Играем песню
            
            playHTML (elem);
            
            $.each (options.otherElems, function (key, value) {
              
              var self = $(value);
              playHTML ($(value + ' .player'));
              
              if (self.find ($('.playlist li')).length)
              playHTML (self.find ($('.playlist .player-id-' + $(value).data ('player-id'))));
              
            });
            
          });
          
          $(song).on ('ended', function () { // Песня кончилась
            
            player.almostEnd = false;
            player.autoSeek = true;
            
            player.init (elem, 'next', song); // Закрываем текущий плеер
            
            var nextSelf = $('body').find ('.audio-player').eq (index + 1);
            
            if (nextSelf.length)
            player.init (nextSelf, 'play'); // Инициализируем следующий за текущим плеер
            
          });
          
        } else { // Тег <audio> не поддерживается, пользуем флеш
          
          player.flash.url = options.url;
          player.flash.object = player.getFlash (options.data.data['player-id']);
          player.flash.volume = player.prepVolume (volume);
          player.flash.elem = elem;
          player.flash.data = data;
          player.flash.song = song;
          player.flash.options = options;
          player.flash.duration = 0;
          player.flash.index = index;
          
          var playFlash = function (elem) {
            
            var time = player.songTime (elem.find ('.seek').slider ('value'));
            
            elem.find ('.seek').slider ({ // Слушаем песню
              
              range: 'min', 
              value: time[0],
              max: 100,
              
              slide: function (e, ui) {
                
                player.flash.pause ();
                player.flash.skipTo (ui.value / 100); // Действие двиганья ползунка уходит во флеш
                player.flash.play ();
                
                var time = player.songTime ((ui.value * player.flash.duration) / 100);
                elem.find ('.time').text (time[1] + ':' + time[2]);
                
              }
              
            });
            
            /*var
            readyTimer,
            loadTimer,
            ios = (/(ipod|iphone|ipad)/i).test (navigator.userAgent),
            i = 0;
            
            readyTimer = setInterval (function () {
              
              var time = player.songTime (i);
              
              elem.find ('.seek').slider ({
                
                range: 'min',
                max: 100,
                value: time[0],
                
              }).removeClass ('progress');
              
              elem.find ('.time').text (time[1] + ':' + time[2]);
              ++i;
              
            }, 1000);*/
            
          };
          
          playFlash (elem);
          
          $.each (options.otherElems, function (key, value) {
            playFlash ($(value));
          });
          
        }
        
        /*if (typeof (song.buffered) !== 'undefined' && song.buffered.length != 0)
        $(song).on ('progress', function () {
          
          var loaded = parseInt (((song.buffered.end (0) / song.duration) * 100), 10);
          elem.find ('.time').text (loaded + '%');
          
        });*/
        
        player.showMarquee (elem.find ('.marquee'));
        
        var playAll = function (elem) {
          
          elem.find ('.volume').slider ({ // Двигаем ползунок звука
            
            range: 'min',
            step: 1,
            value: volume,
            min: 0,
            max: 100,
            
            slide: function (e, ui) {
              
              var value = player.prepVolume (ui.value);
              
              if (canPlay)
                song.volume = value;
              else
                player.flash.setVolume (value);
              
              $.cookie ('volume', ui.value);
              
            }
            
          });
          
          elem.find ($('.player .pause')).click (function () { // Нажали кнопку паузы
            
            player.init (elem, 'pause', song);
            return false;
            
          });
          
          elem.find ($('.player .stop')).click (function () { // Нажали кнопку стоп
            
            player.init (elem, 'stop', song);
            return false;
            
          });
          
          if (elem.find ($('.playlist li')).length) {
            
            elem.find ($('.playlist .pause')).click (function () {
              
              var el = elem.find ($('.playlist .player-id-' + elem.data ('player-id')));
              
              player.change (el, 'pause', 'play');
              player.init ($('.player-' + el.data ('player-id')), 'pause', song);
              
              return false;
              
            });
            
          }
          
          /*elem.find ($('.player .play')).click (function () {
            
            player.change (elem, 'play', 'pause');
            player.init (elem, 'resume', song);
          
            return false;
            
          });*/
          
        };
        
        playAll (elem);
        
        $.each (elem.data (), function (key, value) {
          options.otherData[key] = value;
        });
        
        $.each (options.otherElems, function (key, value) {
          
          var self = $(value);
          playAll (self);
          
          options.other = true;
          
          self.player (options);
          
          self.find ($('.player .pause')).click (function () { // Нажали кнопку паузы
            
            player.change (elem, 'pause', 'play');
            return false;
            
          });
          
          self.find ($('.player .stop')).click (function () { // Нажали кнопку стоп
            
            player.change (elem, 'pause', 'play');
            return false;
            
          });
          
          self.find ($('.player .play')).click (function () {
            
            player.change (elem, 'play', 'pause');
            return false;
            
          });
          
        });
        
      },
      
      error: function (elem) {
        
        $.each (options.otherElems, function (key, value) {
          
          var self = $(value);
          
          player.change (self.find ($('.playlist li')), 'pause', 'play');
          
          self.find ($('.playlist .play')).click (function () {
            
            var el = $(this).parent ();
            
            if (el.length) {
              
              player.change (el, 'play', 'pause');
              player.init ($('.player-' + el.data ('player-id')), 'play');
              
              self.find ($('.playlist .selected')).removeClass ('selected');
              self.find (el).addClass ('selected');
              
            }
            
            return false;
            
          });
          
        });
        
        player.change (elem, 'pause', 'play');
        
        options.error (elem, options.answer.error);
        
        elem.find ($('.player .play')).click (function () {
          return false;
        }); // Больше не разрешаем играть, все-равно не найдена
        
      },
      
      getElementId: function (id) {
        
        var i = 0, thisId = 0;
        
        $('body').find (player.elem).each (function () {
          
          if ($(this).data ('player-id') == id) thisId = i;
          ++i;
          
        });
        
        return thisId;
        
      },
      
      init: function (elem, action, song) { // Святая святых
        
        if (elem.data ('url'))
          options.url = elem.data ('url');
        
        if (elem.data ('artist'))
          options.answer.success.artist = elem.data ('artist');
        
        if (elem.data ('title'))
          options.answer.success.title = elem.data ('title');
        
        var canPlay = (action == 'play' || player.canPlay ());
        
        if (options.debug) alert (action);
        
        if (canPlay || (!canPlay && hasFlash ())) {
          
          options.init (elem, action);
          
          var playAll = function (elem, play) {
            
            switch (action) {
              
              case 'play': { // Действие проигрывания (инициализация плеера)
                
                player.change (elem.find ('.player'), 'play', 'pause');
                
                //elem.removeClass ('player-' + elem.attr ('data-player-id'));
                
                //if (elem.data ('player-id'))
                //elem.addClass ('player-' + elem.data ('player-id'));
                //alert (elem.data ('player-id'));
                
                if (play) {
                  
                  //if (!options.url) { // Если не установлен тег src - получаем URL аяксом (да, мы произносим его как "аякс")
                    
                    options.data.data = {
                      
                      id: elem.data ('id'),
                      'player-id': elem.data ('player-id'),
                      
                    };
                    
                    player.ajax (action, function (data) {
                      
                      options.answer = $.parseJSON (data);
                      options.url = options.answer.success.url;
                      
                      if (options.answer.success && (equals (options.url, 'http://') || equals (options.url, 'https://')))
                        player.play (elem, action, song);
                      else
                        player.error (elem);
                      
                    });
                    
                  //} else player.play (elem, action, song);
                  
                }
                
                break;
                
              }
              
              case 'pause': { // Действие паузы
                
                if (!song.paused || player.getFlash (options.data.data['player-id'])) {
                  
                  if (canPlay) {
                    if (player.isPlaying (song)) song.pause ();
                  } else player.flash.pause (); // Командуем флешу "Пауза"
                  
                  player.ajax (action);
                  
                  //elem.find ('.marquee').replaceWith (elem.find ('.marquee').text ());
                  
                  player.resetTitle (action);
                  
                  var playAll = function (elem) {
                    
                    player.change ($('.player-' + elem.data ('player-id')), 'pause', 'play');
                    
                    $.each (options.otherElems, function (key, value) {
                      
                      var self = $(value);
                      
                      if (self.find ($('.playlist li')).length)
                      player.change (self.find ($('.playlist .player-id-' + self.data ('player-id'))), 'pause', 'play');
                      
                    });
                    
                    elem.find ($('.player .play')).click (function () { // Нажали кнопку play
                      
                      player.change ($(this).parent (), 'play', 'pause');
                      player.init (elem, 'resume', song);
                      
                      return false;
                      
                    });
                    
                    elem.find ('.stop').click (function () { // Нажали кнопку стоп
                      
                      player.init (elem, 'stop', song);
                      return false;
                      
                    });
                    
                    if (elem.find ($('.playlist li')).length) {
                      
                      player.change (elem.find ($('.playlist .player-id-' + elem.data ('play-id'))), 'pause', 'play');
                      
                      elem.find ($('.playlist .play')).click (function () {
                        
                        var el = $(this).parent ();
                        
                        if (el.length) {
                          
                          player.change (el, 'play', 'pause');
                          player.init (elem, 'resume', song);
                          
                        }
                        
                        return false;
                        
                      });
                      
                    }
                    
                  };
                  
                  playAll (elem);
                  
                  $.each (options.otherElems, function (key, value) {
                    
                    player.change ($(value + ' .player'), 'pause', 'play');
                    playAll ($(value));
                    
                  });
                  
                }
                
                break;
                
              }
              
              case 'resume': { // Играем после паузы
                
                if ((song && song.paused) || player.getFlash (options.data.data['player-id'])) {
                  
                  if (canPlay) {
                    if (!player.isPlaying (song)) song.play ();
                  } else player.flash.resume (); // Командуем "Продолжить" флешу
                  
                  /*if (canPlay) {
                    
                    $(song).action ('timeupdate', function () {
                      
                      var time = player.songTime ($(this).slider ('value'));
                      
                      elem.find ('.seek').slider ({
                        
                        range: 'min',
                        max: song.duration,
                        value: time[0],
                        
                        slide: function (e, ui) {
                          song.currentTime = ui.value;
                        }
                        
                      });
                      
                      elem.find ('.time').text (time[1] + ':' + time[2]);
                      
                    });
                    
                  }*/
                  
                  //elem.find ('.seek').wrapInner ('<div class="marquee"></div>');
                  //player.showMarquee (elem.find ('.marquee'));
                  
                  player.setTitle (action);
                  
                  var playAll = function (elem) {
                    
                    player.change ($('.player-' + elem.data ('player-id')), 'play', 'pause');
                    
                    elem.find ($('.player .pause')).click (function () { // Нажали кнопку паузы
                      
                      player.init (elem, 'pause', song);
                      return false;
                      
                    });
                    
                    elem.find ($('.player .stop')).click (function () { // Нажали кнопку стоп
                      
                      player.init (elem, 'stop', song);
                      return false;
                      
                    });
                    
                    if (elem.find ($('.playlist li')).length)
                    elem.find ($('.playlist .pause')).click (function () {
                      
                      var el = $(this).parent ();
                      
                      if (el.length) {
                        
                        player.change (el, 'pause', 'play');
                        player.init (elem, 'pause', song);
                        
                      }
                      
                      return false;
                      
                    });
                    
                  };
                  
                  playAll (elem);
                  
                  $.each (options.otherElems, function (key, value) {
                    
                    player.change ($(value + ' .player'), 'play', 'pause');
                    playAll ($(value));
                    
                  });
                  
                }
                
                break;
                
              }
              
              case 'stop': case 'next': {
                
                if (song) {
                  
                  //elem.find ('.marquee').replaceWith (elem.find ('.marquee').text ());
                  
                  if (action == 'stop') player.resetTitle (action);
                  
                  if (canPlay || player.getFlash (options.data.data['player-id'])) {
                    
                    player.change (elem, 'pause', 'play');
                    
                    player.ajax (action);
                    
                    if (canPlay) {
                      
                      if (player.isPlaying (song)) song.pause ();
                      
                      if (action == 'stop' && song.currentTime > 0)
                      song.currentTime = 0;
                      
                      var time = player.songTime (song.duration - 1);
                      
                    } else {
                      
                      player.flash.pause (); // Командуем флешу "Пауза" (То есть буквально "Стоп". Как такового стопа нет)...
                      player.flash.skipTo (0); // ... и перематываем песню на начало
                      
                      var time = player.songTime (player.flash.duration);
                      
                    }
                    
                  }
                  
                  var playAll = function (elem, play) {
                    
                    elem.find ($('.player .play')).click (function () {
                      
                      player.init (elem, 'play');
                      return false;
                      
                    });
                    
                    if (play) player.change (elem, 'pause', 'play');
                    
                    elem.find ('.seek').slider ({ range:'min', min:0, value:0 }); // Сдвигаем ползунок прогресса прослушивания на начало...
                    
                    elem.find ('.time').text (time[1] + ':' + time[2]); // ...и меняем время на длительность песни
                    
                    if (elem.find ($('.playlist li')).length)
                    elem.find ($('.playlist .play')).click (function () {
                      
                      var el = $(this).parent ();
                      
                      if (el.length) {
                        
                        elem.find ($('.playlist .selected')).removeClass ('selected');
                        elem.find (el).addClass ('selected');
                        
                        player.change (el, 'play', 'pause');
                        
                      }
                      
                      return false;
                      
                    });
                    
                  };
                  
                  playAll ($('.player-' + elem.data ('player-id')), 1);
                  
                  if (elem.find ($('.playlist li')).length)
                  elem.find ($('.playlist .play')).click (function () {
                    
                    //alert (elem.attr ('data-play-id'));
                    player.init ($('.player-' + elem.attr ('data-play-id')), 'play');
                    //[BUG]
                    
                  });
                  
                  $.each (options.otherElems, function (key, value) {
                    playAll ($(value));
                  });
                  
                  song.remove (); // Уничтожаем текущий плеер
                  
                }
                
                break;
                
              }
              
            }
            
          };
          
          playAll (elem, true);
          
          $.each (options.otherElems, function (key, value) { // Работаем с доп. плеерами
            
            var self = $(value);
            playAll (self);
            
            self.attr ('data-play-id', elem.data ('player-id'));
            
            self.find ($('.player .play')).click (function () { // Нажали кнопку play
              
              var find = $('.player-' + self.data ('player-id'));
              player.change (find, 'play', 'pause'); // В плейлисте
              
              if (self.find ($('.playlist li')).length)
              player.change (self.find ($('.playlist .player-id-' + self.data ('player-id'))), 'play', 'pause'); // В плеерах
              
              return false;
              
            });
            
            self.find ($('.player .pause')).click (function () { // Нажали кнопку pause
              
              var find = $('.player-' + self.data ('player-id'));
              player.change (find, 'pause', 'play');
              
              if (self.find ($('.playlist li')).length)
              player.change (self.find ($('.playlist .player-id-' + self.data ('play-id'))), 'pause', 'play');
              
              return false;
              
            });
            
          });
          
          options.complete (elem, action);
          
          return false;
          
        } else options.cantPlayError (elem);
        
      },
      
      songTime: function (time, rawSecs) {
        
        var mins = '--', secs = '--';
        
        if (time) {
          
          time = Math.floor (time);
          
          if (!isNaN (time)) {
            
            mins = Math.floor (time / 60);
            
            if (rawSecs)
            secs = time;
            else
            secs = Math.floor (time % 60);
            
            if (mins <= 9) mins = '0' + mins;
            if (secs <= 9) secs = '0' + secs;
            
          }
          
        }
        
        return [time, mins, secs];
        
      },
      
      canPlay: function () {
        return canPlay (options.url);
      },
      
      song: false,
      url: false,
      
      flash: {
        
        options: {},
        
        loadStarted: function () {
          
          var elem = player.flash.object;
          
          elem.init (player.flash.url);
          
          elem.setVolume (player.flash.volume);
          elem.play ();
          
        },
        
        play: function () {
          player.flash.object.play ();
        },
        
        pause: function () {
          player.flash.object.pause ();
        },
        
        resume: function () {
          player.flash.object.resume ();
        },
        
        setVolume: function (vol) {
          player.flash.object.setVolume (vol);
        },
        
        loadProgress: function (percent, duration) {
          
          player.flash.duration = duration;
          
          player.flash.elem.find ('.seek').slider ({
            
            range: 'min',
            value: (percent * 100),
            max: 100,
            
          }).addClass ('progress');
          
          var time = player.songTime ();
          player.flash.elem.find ('.time').text (time[1] + ':' + time[2]);
          
        },
        
        updatePlayhead: function (level, duration) {
          
          player.flash.elem.find ('.seek').slider ({
            
            range: 'min',
            value: (level * 100),
            max: 100,
            
          }).removeClass ('progress');
          
          var time = player.songTime (level * duration);
          player.flash.elem.find ('.time').text (time[1] + ':' + time[2]);
          
        },
        
        skipTo: function (percent) {
          player.flash.object.skipTo (percent);
        },
        
        trackEnded: function (type) {
          
          player.init (player.flash.elem, 'ended', player.flash.options, player.flash.song);
          
          var time = player.songTime (player.flash.duration);
          player.flash.elem.find ('.time').text (time[1] + ':' + time[2]);
          
          var
            elem = $('body').find (player.flash.options.element),
            nextSelf = elem.eq (player.flash.index + 1);
          
          if (nextSelf.length)
          player.init (nextSelf, 'play', player.flash.options); // TODO
          
        },
        
        loadFinished: function (duration) {
          player.flash.elem.find ('.seek').removeClass ('progress');
        },
        
        loadError: function () {
          
          var text = player.flash.options.swfError;
          if (!text) text = 'Не удалось проиграть трек';
          
          player.flash.options.error(player.flash.elem, text);
          
        },
        
      },
      
    };
    
    if (!$.isArray (options.otherElems))
    options.otherElems = [options.otherElems];
    
    if (player.elem.length && !$('#player-' + options['player-id']).length) {
      
      var init = function (elem) {
        
        var
        windowWidth = $(window).width (),
        seekWidth = elem.find ('.seek').width ();
        
        $(window).resize (function () {
          
          elem.find ('resizeElem').width (seekWidth);
          var width = Math.ceil (($(this).width () * elem.find ('resizeElem').width ()) / windowWidth);
          elem.find ('resizeElem').width (width);
          
        });
        
        elem.find ('.seek')
        .slider ({ range:'min', min:0, value:0, step:1,
        
          slide: function (e, ui) { // Перематываем вручную
            
            player.checkSongEnded (song, ui.value);
            //song.currentTime = ui.value;
            
          }
          
        });
        
        elem.find ('.volume')
        .slider ({ range:'min', value:options.volume, min:0, max:100, step:1, slide: function (e, ui) {
            $.cookie ('volume', ui.value);
          }
        });
        
        if (options.otherData) {
          
          $.each (options.otherData, function (key, value) {
            elem.data (key, value);
          });
          
          //[TODO]
          //elem.find ($('.player .artist')).text (elem.data ('artist'));
          //elem.find ($('.player .title')).text (elem.data ('title'));
          
        }
        
      };
      
      init (player.elem);
      
      var tracks = '';
      
      player.elem.each (function () { // Обрабатываем все плееры на странице
        
        var self = $(this), id = getRandom (10), datas = {};
        
        if (!options.other) {
          
          //alert (self.attr ('class'));
          
          self.addClass ('player-' + id);
          self.attr ('data-player-id', id); // Только attr ()! data () не работает!
          
          self.find ($('.player .play')).click (function () {
            
            player.init (self, 'play');
            return false;
            
          });
          
          self.addClass (options.theme);
          
        }
        
        $.each (self.data (), function (key, value) {
          datas[key] = value;
        });
        
        var style = '';
        if (player.elem.data ('player-id') == id) style += ' selected';
        
        tracks += '\
<li class="player-id-' + id + style + '" data-player-id="' + id + '">\
  <div class="button play"></div>\
  <div class="artist">' + datas.artist + '</div>\
  <div class="mdash">&mdash;</div>\
  <div class="title">' + datas.title + '</div>\
  <div class="slider seek"></div>\
</li>';
        
      });
      
      if (!options.other)
      $.each (options.otherElems, function (key, value) {
        
        var self = $(value);
        
        //self.addClass ('audio-player');
        init (self);
        
        if (self.find ('.playlist').length)
        self.find ('.playlist').html (tracks);
        
        if (self.find ($('.playlist li')).length) {
          
          self.find ($('.playlist li')).click (function () { // Кликаем по элементу плейлиста
            
            self.find ($('.playlist .selected')).removeClass ('selected');
            $(this).addClass ('selected');
            
          });
          
          self.find ('.prev').click (function () {
            
            player.change ($('.playlist .selected'), 'pause', 'play');
            
            var el = $('.playlist .selected').prev ();
            
            if (el.length) {
              
              player.change (el, 'play', 'pause');
              
              self.find ($('.playlist .selected')).removeClass ('selected');
              self.find (el).addClass ('selected');
              
            }
            
            return false;
            
          });
          
          self.find ('.next').click (function () {
            
            player.change ($('.playlist .selected'), 'pause', 'play');
            
            var el = $('.playlist .selected').next ();
            
            if (el.length) {
              
              player.change (el, 'play', 'pause');
              
              self.find ($('.playlist .selected')).removeClass ('selected');
              self.find (el).addClass ('selected');
              
            }
            
            return false;
            
          });
          
          self.find ($('.playlist .play')).click (function () { // Начинаем проигрывание
            
            var el = $(this).parent ();
            
            //self.attr ('data-play-id', el.data ('player-id'));
            
            self.find ($('.playlist .selected')).removeClass ('selected');
            self.find (el).addClass ('selected');
            
            player.change (el, 'play', 'pause');
            player.init ($('.player-' + el.data ('player-id')), 'play');
            
            return false;
            
          });
          
        }
        
        self.find ($('.player .play')).click (function () {
          
          var el = $('.player-' + $('.playlist .selected').data ('player-id'));
          player.init (el, 'play'); // Играем выделенную песню в плейлисте
          
          return false;
          
        });
        
        var nav = function () {
          
          var el = $('.playlist .selected');
          
          if (el.length) {
            
            el = el.data ('player-id');
            el = $('.player-' + el);
            
            player.init (el, 'play');
            
          }
          
        };
        
        self.find ('.prev').click (function () {
          
          nav ();
          return false;
          
        });
        
        self.find ('.next').click (function () {
          
          nav ();
          return false;
          
        });
        
      });
      
    }
    
  };