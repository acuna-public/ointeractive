  $.player = {
    
    'action': function (self, action, provider, options, old) { // Святая святых
      
      //alert (action);
      //if (provider.canPlay || (!provider.canPlay && hasFlash ())) {
      
      if (!provider.loaded) {
        
        provider.loaded = true;
        options.otherElements.push (self); // Добавляем текущий плеер
        
      }// else options.otherElements[player.num] = self;
      
      options.action (self, action);
      
      switch (action) {
        
        case 'play': { // Действие проигрывания (инициализация плеера)
          
          if (provider.isPaused ()) { // Песня стоит на паузе, возобновляем прослушивание
            
            provider.resume ();
            
            provider.setTitle (action);
            provider.processPlayers ('play', 'pause');
            
          } else { // Песня не играет, начинаем играть
            
            //if (!options['answer']) { // Если не установлен тег src - получаем URL аяксом (да, мы произносим его как "аякс")
              
              options.data.data = {
                
                'id': self.data ('id'),
                
              };
              
              provider.ajax (self, action, function (data) {
                
                options['answer'] = data;
                
                if (self.data ('url'))
                  options['answer']['success']['url'] = self.data ('url');
                
                if (options['answer']['success'])
                  
                  if (self.data ('artist'))
                    options['answer']['success']['artist'] = self.data ('artist');
                  
                  if (self.data ('title'))
                    options['answer']['success']['title'] = self.data ('title');
                  
                  if (options['answer']['success']['url'] &&
                    (
                      equals (options['answer']['success']['url'], 'http://')
                      ||
                      equals (options['answer']['success']['url'], 'https://')
                    )
                  )
                    provider.start (self); // 2 шаг
                else {
                  
                  $.player.action (self, 'error', provider, options);
                  options.error (self, options.answer.error);
                  
                }
                
              });
              
            //} else provider.start (self);
            
          }
          
          break;
          
        }
        
        case 'pause': { // Действие паузы
          
          if (!provider.isPaused ()) {
            
            if (provider.isPlaying ()) provider.pause ();
            
            provider.ajax (self, action);
            provider.resetTitle (action);
            provider.processPlayers ('pause', 'play');
            
          }
          
          break;
          
        }
        
        case 'error': {
          
          provider.processPlayers ('pause', 'play');
          
          self.find ('.play').click (function () {
            return false;
          }); // Больше не разрешаем играть, все-равно не найдена
          
          //$.player.action (self, 'stop', provider, options); // Закрываем текущий плеер
          
          break;
          
        }
        
        case 'stop': case 'next': { // next аналогична stop, только не сбрасывает тайтл сайта
          
          if (action == 'stop')
            provider.resetTitle (action);
          else
            provider.ajax (self, action);
          
          provider.next ();
          
          $.each (options.otherElements, function (key, value) {
            
            var elem = provider.getPlayer (value);
            
            provider.change (elem, 'pause', 'play');
            
            elem.find ('.seek').slider ({
              
              'range': 'min',
              'min': 0,
              'value': 0,
              
            }); // Сдвигаем ползунок прогресса прослушивания на начало у всех плееров на странице
            
          });
          
          if (old) options.otherElements[provider.num] = old;
          
          var nextSelf = $('.player-' + (provider.id + 1));
          
          if (action == 'next' && nextSelf.length)
            $.player.action (nextSelf, 'play', provider, options); // Инициализируем следующий за текущим плеер
          
          break;
          
        }
        
      }
      
      options.complete (self, action);
      
    }
    
  };