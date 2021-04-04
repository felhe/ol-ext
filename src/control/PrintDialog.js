/*
  Copyright (c) 2019 Jean-Marc VIGLINO,
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/

import ol_ext_inherits from '../util/ext'
import ol_control_Control from 'ol/control/Control'
import ol_ext_element from '../util/element'
import ol_control_Dialog from './Dialog';

/** Print control to get an image of the map
 * @constructor
 * @fire print
 * @fire error
 * @fire printing
 * @extends {ol.control.Control}
 * @param {Object=} options Control options.
 *	@param {String} options.className class of the control
 *	@param {string} options.imageType A string indicating the image format, default image/jpeg
 *	@param {number} options.quality Number between 0 and 1 indicating the image quality to use for image formats that use lossy compression such as image/jpeg and image/webp
 *	@param {string} options.orientation Page orientation (landscape/portrait), default guest the best one
 *	@param {boolean} options.immediate force print even if render is not complete,  default false
 */
var ol_control_PrintDialog = function(options) {
  if (!options) options = {};

  var element = ol_ext_element.create('DIV', {
    className: (options.className || 'ol-print') + ' ol-unselectable ol-control'
  });
  ol_ext_element.create('BUTTON', {
    type: 'button',
    click: function() { this.print(); }.bind(this),
    parent: element
  });
  ol_control_Control.call(this, {
    element: element
  });

  // Print control
  options.target = ol_ext_element.create('DIV');
  var printCtrl = this._printCtrl = new ol_control_Print(options);

  // Print dialog
  var printDialog = this._printDialog = new ol_control_Dialog({
    target: document.body,
    closeBox: true,
    className: 'ol-ext-print-dialog'
  });
  var content = printDialog.getContentElement();
  this._select = {};
  var param = ol_ext_element.create('DIV',{
    className: 'ol-print-param',
    parent: content
  });
  var printMap = this.printElement = ol_ext_element.create('DIV');
  ol_ext_element.create('DIV', {
    html: printMap,
    className: 'ol-print-map',
    parent: content
  });
  ol_ext_element.create('H2',{
    html: options.printLabel || 'Print',
    parent: param
  });
  var ul = ol_ext_element.create('UL',{ parent: param });

  // Orientation
  var li = ol_ext_element.create('LI', { 
    html: ol_ext_element.create('LABEL', {
      html: options.orientationLabel || 'Orientation'
    }),
    className: 'ol-orientation',
    parent: ul 
  });
  var ori = this._select.orientation = ol_ext_element.create('SELECT', {
    parent: li,
    on: { change: function(e) { 
      this.setOrientation(e.target.value);
    }.bind(this) }
  });
  ol_ext_element.create('OPTION',{
    html: options.portraitLabel || 'Portrait',
    value: 'portrait',
    parent: ori
  });
  ol_ext_element.create('OPTION',{
    html: options.portraitLabel || 'Landscape',
    value: 'landscape',
    parent: ori
  });

  // Page size
  li = ol_ext_element.create('LI',{ 
    html: ol_ext_element.create('LABEL', {
      html: options.orientationLabel || 'Page size',
    }),
    className: 'ol-size',
    parent: ul 
  });
  var size = this._select.size = ol_ext_element.create('SELECT', {
    on: { change: function(){
      this.setSize(size.value || originalSize);
    }.bind(this) },
    parent: li
  });
  for (var s in this.paperSize) {
    ol_ext_element.create('OPTION', {
      html: s + (this.paperSize[s] ? ' - '+this.paperSize[s][0]+'x'+this.paperSize[s][1]+' mm' : ''),
      value: s,
      parent: size
    });
  }

  // Margin
  li = ol_ext_element.create('LI',{ 
    html: ol_ext_element.create('LABEL', {
      html: options.marginLabel || 'Margin',
    }),
    className: 'ol-margin',
    parent: ul 
  });
  var margin = this._select.margin = ol_ext_element.create('SELECT', {
    on: { change: function(){
      this.setMargin(margin.value);
    }.bind(this) },
    parent: li
  });
  for (var s in this.marginSize) {
    ol_ext_element.create('OPTION', {
      html: s + ' - ' + this.marginSize[s] + ' mm',
      value: this.marginSize[s],
      parent: margin
    });
  }

  // Save as
  li = ol_ext_element.create('LI',{ 
    className: 'ol-saveas',
    parent: ul 
  });
  var save = ol_ext_element.create('SELECT', {
    on: { change: function() {
      console.log(save.value)
      save.value = '';
    }.bind(this) },
    parent: li
  });
  ol_ext_element.create('OPTION', {
    html: options.saveasLabel || 'Save as...',
    style: { display: 'none' },
    value: '',
    parent: save
  });
  for (var s in this.formats) {
    ol_ext_element.create('OPTION', {
      html: this.formats[s],
      value: s,
      parent: save
    });
  }

  // Print
  var prButtons = ol_ext_element.create('DIV', {
    className: 'ol-ext-buttons',
    parent: param
  });
  ol_ext_element.create('BUTTON', {
    html: options.printLabelBt || 'Print...',
    type: 'submit',
    click: function() { window.print(); },
    parent: prButtons
  });
  ol_ext_element.create('BUTTON', {
    html: options.cancelLabelBt || 'cancel',
    type: 'reset',
    click: function() { printDialog.hide(); },
    parent: prButtons
  });

  // Handle dialog show/hide
  var originalTarget;
  var originalSize;
  
  printDialog.on('show', function() {
    var map = this.getMap();
    if (!map) return;
    document.body.classList.add('ol-print-document');
    originalTarget = map.getTargetElement();
    originalSize = map.getSize();
    this.setSize(this._size || originalSize);
    map.setTarget(printMap);
  }.bind(this));

  printDialog.on('hide', function() {
    document.body.classList.remove('ol-print-document');
    if (!originalTarget) return;
    this.getMap().setTarget(originalTarget);
    originalTarget = null;
  }.bind(this));

  // Update preview on resize
  window.addEventListener('resize', function() {
    this.setSize();
  }.bind(this));
};
ol_ext_inherits(ol_control_PrintDialog, ol_control_Control);

/** List of paper size */
ol_control_PrintDialog.prototype.paperSize = {
  '': null,
  'A0': [841,1189],
  'A1': [594,841],
  'A2': [420,594],
  'A3': [297,420],
  'A4': [210,297],
  'A5': [148,210],
  'B4': [257,364],
  'B5': [182,257]
};

/** List of margin size */
ol_control_PrintDialog.prototype.marginSize = {
  none: 0,
  small: 5,
  large: 10
};

/** List of print formats */
ol_control_PrintDialog.prototype.formats = {
  jpeg: 'save as jpeg',
  png: 'save as png',
  pdf: 'save as pdf'
};

/** Get print orientation
 * @returns {string}
 */
ol_control_PrintDialog.prototype.getOrientation = function () {
  return this._orientation;
};

/** Set print orientation
 * @param {string}
 */
ol_control_PrintDialog.prototype.setOrientation = function (ori) {
  this._orientation = (ori==='landscape' ? 'landscape' : 'portrait');
  this._select.orientation.value = this._orientation;
  this.setSize();
};

/** Get print margin
 * @returns {number}
 */
ol_control_PrintDialog.prototype.getMargin = function () {
  return this._margin;
};

/** Set print margin
 * @param {number}
 */
ol_control_PrintDialog.prototype.setMargin = function (margin) {
  this._margin = margin;
  this._select.margin.value = margin;
  this.setSize();
};

/** Get print size
 * @returns {ol.size}
 */
ol_control_PrintDialog.prototype.getSize = function () {
  return this._size;
};

/** Set map print size
 * @param {ol/size} size
 */
ol_control_PrintDialog.prototype.setSize = function (size) {
  if (size) this._size = size;
  else size = this._size;
  if (!size) return;

  if (typeof(size) === 'string') {
    if (!this.paperSize[size]) size = this._size = 'A4';
    this._select.size.value = size;
    size = [
      Math.trunc(this.paperSize[size][0]* 96/25.4),
      Math.trunc(this.paperSize[size][1]* 96/25.4)
    ]
    if (this._orientation === 'landscape') {
      size = [size[1], size[0]];
    }
    this._select.orientation.disabled = false;
  } else {
    this._select.size.value = '';
    this._select.orientation.disabled = true;
  }

  var s = this.printElement.parentNode.getBoundingClientRect();
  var scx = (s.width - 40) / size[0];
  var scy = (s.height - 40) / size[1];
  var sc = Math.min(scx, scy, 1);
  this.printElement.style.width = size[0]+'px';
  this.printElement.style.height = size[1]+'px';
  this.printElement.style['-webkit-transform'] = 
  this.printElement.style.transform = 'translate(-50%,-50%) scale('+sc+')';
  var px = Math.round(5/sc);
  this.printElement.style['-webkit-box-shadow'] = 
  this.printElement.style['box-shadow'] = px+'px '+px+'px '+px+'px rgba(0,0,0,.6)';
  this.printElement.style['padding'] = (this.getMargin() * 96/25.4)+'px';
  this.getMap().updateSize();
};

/**
 * Remove the control from its current map and attach it to the new map.
 * Subclasses may set up event handlers to get notified about changes to
 * the map here.
 * @param {ol.Map} map Map.
 * @api stable
 */
ol_control_PrintDialog.prototype.setMap = function (map) {
  if (this.getMap()) {
    this.getMap().removeControl(this._printCtrl);
    this.getMap().removeControl(this._printDialog);
  }
  ol_control_Control.prototype.setMap.call(this, map);
  if (this.getMap()) {
    this.getMap().addControl(this._printCtrl);
    this.getMap().addControl(this._printDialog);
  }
};

/** Show print dialog */
ol_control_PrintDialog.prototype.print = function() {
  this._printDialog.show();
};

export default ol_control_PrintDialog
