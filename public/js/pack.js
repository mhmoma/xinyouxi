(function (global) {
  "use strict";

  var blobs = {};

  var VideoPack = {
    blobs: blobs,

    registerBlob: function (name, blobOrUrl) {
      if (!name) return;
      var url = typeof blobOrUrl === "string" ? blobOrUrl : URL.createObjectURL(blobOrUrl);
      var baseName = name.replace(/^.*[\\\/]/, "");
      blobs[name] = url;
      blobs[baseName] = url;
      blobs["video/" + baseName] = url;
      return url;
    },

    registerBlobMap: function (map) {
      if (!map) return;
      for (var k in map) {
        if (Object.prototype.hasOwnProperty.call(map, k)) {
          VideoPack.registerBlob(k, map[k]);
        }
      }
    },

    resolve: function (src) {
      if (!src) return "";
      if (src.indexOf("blob:") === 0) return src;
      var baseName = src.replace(/^.*[\\\/]/, "");
      if (blobs[src]) return blobs[src];
      if (blobs[baseName]) return blobs[baseName];
      if (blobs["video/" + baseName]) return blobs["video/" + baseName];
      return src;
    },

    hasBlob: function (src) {
      if (!src) return false;
      if (src.indexOf("blob:") === 0) return true;
      var baseName = src.replace(/^.*[\\\/]/, "");
      return !!(blobs[src] || blobs[baseName] || blobs["video/" + baseName]);
    },

    loadPackFromFiles: function (files) {
      var count = 0;
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file.name.match(/\.(webm|mp4)$/i)) {
          VideoPack.registerBlob(file.name, file);
          count++;
        }
      }
      return count;
    }
  };

  global.VideoPack = VideoPack;
  global.PACK_BLOBS = blobs;
})(window);
