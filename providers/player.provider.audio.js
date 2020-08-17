  $.player.provider.audio = function () {
    
    return {
      
      newInstance: function (player, options) {
        
        var audio;
        
        player.create = function () {
          
          if (!audio) {
            
            try {
              
              audio = new Audio ();
              
              audio.src = options['answer']['success']['url'];
              
              player.canPlay = true;
              
            } catch (e) {
              player.canPlay = false;
            }
            
          } else audio.src = options['answer']['success']['url'];
          
        };
        
        player.play = function () {
          
          if (!player.isPlaying ()) audio.play ();
          
          audio.volume = player.prepVolume (options.volume);
          
          audio.addEventListener ('timeupdate', function () { // Играем песню
            
            $.each (options.otherElements, function (key, value) {
              
              var elem = player.getPlayer (value);
              
              //player.setTime (elem.find ('.seek').slider ('value'));
              
              player.checkSongEnded (audio.currentTime);
              
              var time = player.songTime (audio.currentTime);
              
              elem.find ('.seek').slider ({
                
                'range': 'min',
                'value': time[0],
                'max': audio.duration,
                
                'slide': function (e, ui) { // Перематываем вручную
                  
                  if (!options.debug) player.autoSeek = false; // Отключаем коллбек того, что песня заканчивается для предотвращения накруток прослушиваний при перемотке вручную
                  player.setTime (ui.value);
                  
                }
                
              });
              
              if (audio.currentTime)
                elem.find ('.time').text (time[1] + ':' + time[2]);
              
            });
            
          });
          
          audio.addEventListener ('ended', function () { // Песня кончилась
            
            player.almostEnd = false;
            player.autoSeek = true;
            
            var elem = $('.player-' + player.id);
            
            $.player.action (elem, 'next', player, options); // Переходим к следующему треку
            
          });
          
          audio.addEventListener ('loadeddata', function () {
            
            if (this.buffered && this.buffered.length > 0)
            audio.addEventListener ('progress', function () {
              options.buffered ($('.player-' + player.id), Math.ceil ((this.buffered.end (0) / this.duration) * 100));
            });
            
          });
          
        }
        
        player.pause = function () {
          audio.pause ();
        };
        
        player.resume = function () {
          audio.play ();
        };
        
        player.setTime = function (time) {
          audio.currentTime = time;
        };
        
        player.next = function () {
          
          if (player.isPlaying ()) audio.pause ();
          player.setTime (0);
          
          audio.addEventListener ('loadeddata', function () {
            
            var time = player.songTime (this.duration);
            var self = $('.player-' + player.prev);
            
            self.find ('.time').text (time[1] + ':' + time[2]); // Меняем время на длительность песни
            
          });
          
        };
        
        player.isPaused = function () {
          return (audio && audio.paused);
        };
        
        player.isPlaying = function () {
          return (
            audio &&
            audio.currentTime > 0 &&
            !audio.paused &&
            !audio.ended &&
            audio.readyState > 2
          );
        };
        
        player.duration = function () {
          return (audio ? audio.duration : 0);
        };
        
        player.setVolume = function (value) {
          if (audio) audio.volume = value;
        };
        
        player.isInit = function () {
          return audio;
        }
        
        return player;
        
      }
      
    };
    
  };