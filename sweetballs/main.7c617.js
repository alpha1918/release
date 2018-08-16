(function () {

  function boot () {

    let settings = window._CCSettings;
    window._CCSettings = undefined;

    if ( !settings.debug ) {
      let uuids = settings.uuids;

      let rawAssets = settings.rawAssets;
      let assetTypes = settings.assetTypes;
      let realRawAssets = settings.rawAssets = {};
      for (let mount in rawAssets) {
        let entries = rawAssets[mount];
        let realEntries = realRawAssets[mount] = {};
        for (let id in entries) {
          let entry = entries[id];
          let type = entry[1];
          // retrieve minified raw asset
          if (typeof type === 'number') {
            entry[1] = assetTypes[type];
          }
          // retrieve uuid
          realEntries[uuids[id] || id] = entry;
        }
      }

      let scenes = settings.scenes;
      for (let i = 0; i < scenes.length; ++i) {
        let scene = scenes[i];
        if (typeof scene.uuid === 'number') {
          scene.uuid = uuids[scene.uuid];
        }
      }

      let packedAssets = settings.packedAssets;
      for (let packId in packedAssets) {
        let packedIds = packedAssets[packId];
        for (let j = 0; j < packedIds.length; ++j) {
          if (typeof packedIds[j] === 'number') {
            packedIds[j] = uuids[packedIds[j]];
          }
        }
      }
    }

    // init engine
    let canvas;
    if (cc.sys.isBrowser) {
      canvas = document.getElementById('GameCanvas');
    }

    function setLoadingDisplay () {
      // Loading splash scene
      let splash = document.getElementById('splash');
      let progressBar = splash.querySelector('.progress-bar span');
      cc.loader.onProgress = function (completedCount, totalCount, item) {
        let percent = 100 * completedCount / totalCount;
        if (progressBar) {
          progressBar.style.width = percent.toFixed(2) + '%';
        }
      };
      splash.style.display = 'block';
      progressBar.style.width = '0%';

      cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
        splash.style.display = 'none';
      });
    }

    let onStart = function () {
      cc.view.resizeWithBrowserSize(true);

      // UC browser on many android devices have performance issue with retina display
      if (cc.sys.os !== cc.sys.OS_ANDROID || cc.sys.browserType !== cc.sys.BROWSER_TYPE_UC) {
        cc.view.enableRetina(true);
      }
      if (cc.sys.isBrowser) {
        setLoadingDisplay();
      }

      if (cc.sys.isMobile) {
        if (settings.orientation === 'landscape') {
          cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
        }
        else if (settings.orientation === 'portrait') {
          cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
        }
        cc.view.enableAutoFullScreen([
            cc.sys.BROWSER_TYPE_BAIDU,
            cc.sys.BROWSER_TYPE_WECHAT,
            cc.sys.BROWSER_TYPE_MOBILE_QQ,
            cc.sys.BROWSER_TYPE_MIUI,
          ].indexOf(cc.sys.browserType) < 0);
      }

      // Limit downloading max concurrent task to 2,
      // more tasks simultaneously may cause performance draw back on some android system / brwosers.
      // You can adjust the number based on your own test result, you have to set it before any loading process to take effect.
      if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
        cc.macro.DOWNLOAD_MAX_CONCURRENT = 2;
      }

      // init assets
      cc.AssetLibrary.init({
        libraryPath: 'res/import',
        rawAssetsBase: 'res/raw-',
        rawAssets: settings.rawAssets,
        packedAssets: settings.packedAssets,
        md5AssetsMap: settings.md5AssetsMap
      });

      // let launchScene = settings.launchScene;
      // let launchScene = 'launch';//getLaunchScene();
      //
      // // load scene
      // cc.director.loadScene(launchScene, null,
      //   function () {
      //     if (cc.sys.isBrowser) {
      //       // show canvas
      //       canvas.style.visibility = '';
      //       let div = document.getElementById('GameDiv');
      //       if (div) {
      //         div.style.backgroundImage = '';
      //       }
      //     }
      //     cc.loader.onProgress = null;
      //     console.log('Success to load scene: ' + launchScene);
      //   }
      // );

      cc.director.preloadScene('game', function(){
        let launchScene = 'launch';//getLaunchScene();
        // load scene
        cc.director.loadScene(launchScene, null,
          function () {
            if (cc.sys.isBrowser) {
              // show canvas
              canvas.style.visibility = '';
              let div = document.getElementById('GameDiv');
              if (div) {
                div.style.backgroundImage = '';
              }
            }
            cc.loader.onProgress = null;
          }
        );
      });
    };

    // jsList
    let jsList = settings.jsList;

    let bundledScript = settings.debug ? 'src/project.dev.js' : 'src/project.acddb.js';
      if (jsList) {
        jsList = jsList.map(function (x) {
          return 'src/' + x;
        });
        jsList.push(bundledScript);
      }
      else {
        jsList = [bundledScript];
      }

    // anysdk scripts
    if (cc.sys.isNative && cc.sys.isMobile) {
      jsList = jsList.concat(['src/anysdk/jsb_anysdk.js', 'src/anysdk/jsb_anysdk_constants.js']);
    }

    let option = {
      //width: width,
      //height: height,
      id: 'GameCanvas',
      scenes: settings.scenes,
      debugMode: settings.debug ? cc.DebugMode.INFO : cc.DebugMode.ERROR,
      showFPS: settings.debug,
      frameRate: 60,
      jsList: jsList,
      groupList: settings.groupList,
      collisionMatrix: settings.collisionMatrix,
      renderMode: 0
    };

    cc.game.run(option, onStart);
  }


  if (window.jsb) {
    require('src/settings.081e0.js');
    require('src/jsb_polyfill.js');
    boot();
    return;
  }

  if (window.document) {
    let splash = document.getElementById('splash');
    splash.style.display = 'block';

    let cocos2d = document.createElement('script');
    cocos2d.async = true;
    cocos2d.src = window._CCSettings.debug ? 'cocos2d-js.js' : 'cocos2d-js-min.06377.js';

    let engineLoaded = function () {
      document.body.removeChild(cocos2d);
      cocos2d.removeEventListener('load', engineLoaded, false);
      window.eruda && eruda.init() && eruda.get('console').config.set('displayUnenumerable', false);
      boot();
    };
    cocos2d.addEventListener('load', engineLoaded, false);
    document.body.appendChild(cocos2d);
  }

})();
