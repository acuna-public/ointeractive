  $.player.provider = function (options) {
    
    var player = {
      
      'id': 0,
      'prev': 0,
      'selected': null,
      'almostEnd': false,
      'autoSeek': true,
      'canPlay': false,
      'elements': [],
      'num': 0,
      
      'next': function () {},
      
      'change': function (self, find, replace) {
        
        self.find ('.' + find).toggleClass (find + ' ' + replace);
        self.find ('.' + find + '-area').hide ();
        
        self.find ('.' + replace).css ('display', 'block'); // Не inline
        self.find ('.' + replace + '-area').css ('display', 'block'); // Не inline
        
      },
      
      'ajax': function (self, action, success, i, error) {
        
        if (!success) success = options[action];
        
        options.data.area = action;
        
        var aoptions = {
          
          'method': options.method,
          'timeout': options.ajaxTimeout,
          
          'error': function (xhr, textStatus, errorThrown) {
            
            player.change (self, 'pause', 'play');
            options.ajaxError (xhr, textStatus, errorThrown);
            
          },
          
          'beforeSend': options.ajaxBeforeSend,
          'complete': options.ajaxComplete,
          'dataType': 'json', // JSON должен приходить всегда
          
        };
        
        if (typeof (options.output) !== 'undefined')
        success = function (result) {
          options.output (result);
        };
        
        $.prettyAjax (options.ajaxUrl, options.data, success, aoptions);
        
      },
      
      'showMarquee': function (elem) {
        
        elem.marquee2 ({
          
          speed: 5,
          gap: 20,
          delayBeforeStart: 0,
          direction: 'left',
          startVisible: true,
          duplicated: true,
          pauseOnHover: true
          
        });
        
      },
      
      'setTitle': function (action) {
        
        if (player.canPlay)
          document.title = "\u25b6 " + options.answer.success.artist + '   —  ' + options.answer.success.title;
        
      },
      
      'resetTitle': function (action) {
        
        if (player.canPlay)
          document.title = document.title.substring (2);
        
      },
      
      'prepVolume': function (vol) {
        return (vol / 100);
      },
      
      'checkSongEnded': function (value) {
        
        if (!player.almostEnd && player.autoSeek && prop (value, player.duration ()) >= options.listenEndPercent) {
          
          player.almostEnd = true;
          player.ajax ('ended');
          
        }
        
      },
      
      'songTime': function (time, rawSecs) {
        
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
      
      'getPlayer': function (value, debug) {
        
        if (debug) alert (value.data ('player-id'));
        return $('.player-' + value.data ('player-id'));
        
      },
      
      'processPlayers': function (find, replace) {
        
        $.each (options.otherElements, function (key, value) {
          player.change (player.getPlayer (value), find, replace);
        });
        
      },
      
      'start': function (self) {
        
        player.prev = player.id; // Сохраняем прошлый id
        player.id = self.data ('player-id');
        
        player.create ();
        
        if (!player.canPlay)
          player.setProvider ($.player.provider.flash ()).create ();
        
        if (player.prev)
          $.player.action ($('.player-' + player.prev), 'stop', player, options, self); // Закрываем предыдущий плеер
        
        player.setTitle ('play');
        
        player.play ();
        
        var playlist = '';
        
        $.each (player.elements, function (key, elem) { // Все плееры на странице (включая дополнительные)
          
          if (elem.data ('area') && elem.data ('area') == self.data ('area'))
            playlist += '\
  <div class="plyr-item">\
    \
    <div class="plyr-item-poster">' + elem.find ('.cover').attr ('src') + '</div>\
    \
    <div class="flex">\
      <div class="plyr-item-title h-1x">\
        ' + elem.find ('.title').text () + '\
      </div>\
      <div class="plyr-item-author text-sm text-fade">\
        ' + elem.find ('.artist').text () + '\
      </div>\
    </div>\
    <button class="plyr-item-close close text">×</button>\
  </div>';
          
        });
        
        $.each (options.otherElements, function (key, value) { // Обрабатываем этот и дополнительные плееры
          
          var elem = player.getPlayer (value);
          
          elem.find ('.playlist-area').html (playlist);
          
          elem.data ('id', self.data ('id')); // Передаем id трека во все дополнительные плееры чтобы можно было слушать и в них
          
          player.change (elem, 'play', 'pause');
          
          var data = options['answer']['success'];
          
          elem.find ('.artist').text (data['artist']);
          elem.find ('.title').text (data['title']);
          elem.find ('.cover').css ('background-image', 'url(\'' + data['cover'] + '\')');
          
          player.showMarquee (elem.find ('.marquee'));
          
          elem.find ('.volume').slider ({ // Двигаем ползунок звука
            
            'range': 'min',
            'step': 1,
            'value': elem.find ('.volume').slider ('value'),
            'min': 0,
            'max': 100,
            
            'slide': function (e, ui) {
              
              player.setVolume (player.prepVolume (ui.value));
              
              elem.each (function () {
                
                $(this).find ('.volume').slider ({
                  'value': ui.value
                });
                
              });
              
              $.cookie ('volume', ui.value);
              
            }
            
          });
          
        });
        
      },
      
      setProvider: function (provider) {
        return provider.newInstance (player, options);
      },
      
    };
    
    if (!options.provider)
      options.provider = $.player.provider.audio ();
    
    return player.setProvider (options.provider);
    
  };