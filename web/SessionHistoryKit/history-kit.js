/*
 * Session History Kit v0.1 - https://github.com/renfeisong/SessionHistoryKit
 * history-kit.js
 *
 * TERMS OF USE - Session History Kit
 * Released to the Public Domain
 * 
 * 2015 Renfei Song, All rights released.
 */

"use strict";

var SessionHistoryKit = SessionHistoryKit || {};

Array.prototype.firstObject = function() {
	return this[0];
};

SessionHistoryKit.SessionHistory = function(containerId, options) {
	this.container = document.getElementById(containerId);
	if (!this.container) {
		console.error('Couldn\'t find HTML node with ID ' + containerId + '.');
	}

	this.operations = [];
	this.dots = [];

	/* Configurable */
	this.width = options.width || 750;
	this.height = options.height || 100;
	this.mainColor = options.mainColor || '#FE9509';
	this.tipBackgroundColor = options.tipBackgroundColor || '#000000';
	this.tipTextColor = options.tipTextColor || '#ffffff';
	this.cardWidth = options.cardWidth || 225;
	this.lineWidth = options.lineWidth || 2;
	this.radius = options.radius || 4;
	this.hoverRadius = options.hoverRadius || 8;
	this.spacingCoefficient = options.spacingCoefficient || 0.001;
	this.maxSpacing = options.maxSpacing || 200;
	this.minSpacing = options.minSpacing || 30;

	this.bind = function(scope, fn) {
   		return function() {
			return fn.apply(scope, arguments);
		}
	};

	this.initSessionCard = function() {
		var card = document.createElement('div');
		card.id = 'shk-session-card';
		card.style.display = 'none';
		card.style.position = 'absolute';

		var operator = document.createElement('div');
		operator.id = 'shk-session-operator';
		card.appendChild(operator);

		var timestamp = document.createElement('div');
		timestamp.id = 'shk-session-timestamp';
		card.appendChild(timestamp);

		var detail = document.createElement('div');
		detail.id = 'shk-session-detail';
		card.appendChild(detail);

		return card;
	};

	this.initCanvas = function() {
		while (this.container.hasChildNodes()) {
			var child = this.container.childNodes.firstObject();
			this.container.removeChild(child);
		}

		var canvas = document.createElement('canvas');
		if (!canvas.getContext) {
			console.error('Canvas is not supported by the browser.');
			return null;
		}

		canvas.addEventListener('mousemove', this.bind(this, this.handleMouseMove), false);
		
		var ctx = canvas.getContext('2d');
		canvas.height = this.height;
		canvas.width = this.width;
		canvas.style.zIndex = '0';
		
		var devicePixelRatio = window.devicePixelRatio || 1;
		var backingStorePixelRatio = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
		var ratio = devicePixelRatio / backingStorePixelRatio;
		if (ratio !== 1) {
			canvas.width = this.width * ratio;
			canvas.height = this.height * ratio;
			canvas.style.width = this.width + 'px';
			canvas.style.height = this.height + 'px';
		}

		ctx.scale(ratio, ratio);

		this.canvas = canvas;
		this.container.appendChild(canvas);
		this.container.appendChild(this.initSessionCard());

		return ctx;
	};

	this.drawDot = function(ctx, x, y, radius, registerDot) {
		var path = new Path2D();
		path.arc(x, y, radius, 0, Math.PI * 2, true);
		ctx.fillStyle = this.mainColor;
		ctx.fill(path);
		if (registerDot) {
			this.dots.push({
				pos: {
					x: x,
					y: y
				},
				hover: false
			});
		}
	};

	this.drawHorizontalLine = function(ctx, x, y, length) {
		var path = new Path2D();
		path.rect(x, y - this.lineWidth / 2, length, this.lineWidth);
		ctx.fillStyle = this.mainColor;
		ctx.fill(path);
	};

	this.getSpacing = function(lastDate, thisDate) {
		var secondsDiff = (thisDate.getTime() - lastDate.getTime()) / 1000;
		var spacing = secondsDiff * this.spacingCoefficient;
		spacing = spacing > this.maxSpacing ? this.maxSpacing : spacing;
		spacing = spacing < this.minSpacing ? this.minSpacing : spacing;
		return spacing;
	};

	this.drawTip = function(ctx, x, y, text) {
		y -= 10;
		var borderRadius = 4;
		var horizontalPadding = 5;
		var verticalPadding = 5;
		var textSize = ctx.measureText(text[0]).width;
		var width = textSize + horizontalPadding * 2;
		var height = text.length * textSize + verticalPadding * 2;
		var arrowWidth = 8;
		var arrowHeight = 8;
		var lt = {
			x: x - width / 2,
			y: y - (height + arrowHeight)
		};
		var rt = {
			x: x + width / 2,
			y: y - (height + arrowHeight)
		};
		var lb = {
			x: x - width / 2,
			y: y - arrowHeight
		};
		var rb = {
			x: x + width / 2,
			y: y - arrowHeight
		};
		var al = {
			x: x - arrowWidth / 2,
			y: y - arrowHeight
		};
		var ar = {
			x: x + arrowWidth / 2,
			y: y - arrowHeight
		};

		var path = new Path2D();
		path.moveTo(x, y);
		path.lineTo(al.x, al.y);
		path.lineTo(lb.x + borderRadius, lb.y);
		path.quadraticCurveTo(lb.x, lb.y, lb.x, lb.y - borderRadius);
		path.lineTo(lt.x, lt.y + borderRadius);
		path.quadraticCurveTo(lt.x, lt.y, lt.x + borderRadius, lt.y);
		path.lineTo(rt.x - borderRadius, rt.y);
		path.quadraticCurveTo(rt.x, rt.y, rt.x, rt.y + borderRadius);
		path.lineTo(rb.x, rb.y - borderRadius);
		path.quadraticCurveTo(rb.x, rb.y, rb.x - borderRadius, rb.y);
		path.lineTo(ar.x, ar.y);
		path.lineTo(x, y);
		ctx.fillStyle = this.tipBackgroundColor;
		ctx.fill(path);

		for (var index = 0, len = text.length; index < len; index++) {
  			var character = text[index];
  			var _x = lt.x + horizontalPadding;
			var _y = lt.y + verticalPadding + textSize * (index + 1) - 1.5;
			ctx.fillStyle = this.tipTextColor;
			ctx.fillText(character, _x, _y);
		}
	};

	this.drawStream = function(ctx, x, y) {
		var x2 = x, y2 = y;
		var that = this;
		this.operations.forEach(function(operation, index) {
			var lastOperation = index == 0 ? null : that.operations[index - 1];
			if (lastOperation) {
				var lastDate = new Date(lastOperation.time);
				var thisDate = new Date(operation.time);
				x2 += that.getSpacing(lastDate, thisDate);
			}
			that.drawDot(ctx, x2, y2, that.radius, true);

			if (index === that.operations.length - 1) {
				that.drawTip(ctx, x2, y2, that.nameOfType(operation.type));
			}
		});

		that.drawHorizontalLine(ctx, x, y, x2 - x);
	};

	this.nameOfType = function(type) {
		switch(type) {
			case 1: return "分发";
			case 2: return "重定向";
			case 3: return "提交审核";
			case 4: return "审核不通过";
			case 5: return "审核通过";
			case 6: return "提交邮件";
			case 7: return "重试";
			case 8: return "放弃";
			case 9: return "发送";
			case 10: return "标记为失败";
			case 11: return "成功";
		}
	};

	this.detailOfOperation = function(operation) {
		// combination of action and receiver
		switch(operation.type) {
			case 1: return "将邮件分发给 " + operation.receiver;
			case 2: return operation.receiver ? "将邮件转发到 " + operation.receiver : "将邮件退回"
			case 3: return "提交给 " + operation.receiver + " 审核";
			case 4: return "拒绝 " + operation.receiver + " 的邮件";
			case 5: return "审核通过";
			case 6: return "提交邮件到发送队列";
			case 7: return "重试发送邮件";
			case 8: return "放弃操作";
			case 9: return "发送邮件";
			case 10: return "发送失败";
			case 11: return "所有操作完成";
		}
	};

	this.mousePosition = function(event) {
		var rect = this.canvas.getBoundingClientRect();
		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
	};

	this.mouseInCircle = function(pos, center, radius) {
		var distance = Math.sqrt(Math.pow(pos.x - center.x, 2) + Math.pow(pos.y - center.y, 2));
		return distance <= radius;
	};

	this.showDetailCard = function(pos, index) {
		var operation = this.operations[index];
		var date = new Date(operation.time);
		document.getElementById('shk-session-timestamp').innerText = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes();
		document.getElementById('shk-session-operator').innerText = operation.operator || "SRFMail Pro";
		document.getElementById('shk-session-detail').innerText = this.detailOfOperation(operation);

		this.container.style.position = 'relative';
		var card = document.getElementById('shk-session-card');
		card.style.width = this.cardWidth + 'px';

		var isFirst = index === 0;
		var isLast = index === this.operations.length - 1;
		var rightSpaceOK = (this.width - (pos.x + 10)) > this.cardWidth;
		var leftSpaceOK = (pos.x - 10) > this.cardWidth;

		if (!isFirst && ((!rightSpaceOK && leftSpaceOK) || (isLast && leftSpaceOK))) {
			// set preferred edge to right
			card.style.left = (pos.x - this.cardWidth - 10) + 'px';
			card.style.top = (pos.y + 10) + 'px';
		} else {
			// set preferred edge to left
			card.style.left = (pos.x + 10) + 'px';
			card.style.top = (pos.y + 10) + 'px';
		}

		card.style.display = 'block';
	};

	this.hideDetailCard = function() {
		document.getElementById('shk-session-card').style.display = 'none';
	}
};

SessionHistoryKit.SessionHistory.prototype.setOperations = function(_operations) {
	this.operations = _operations;
};

SessionHistoryKit.SessionHistory.prototype.handleMouseMove = function(event) {
	var pos = this.mousePosition(event);
	var ctx = this.canvas.getContext('2d');

	var that = this;
	this.dots.some(function(dot, index) {
		var inHoverCircle = that.mouseInCircle(pos, dot.pos, that.hoverRadius);
		
		// mouse enter
		if (inHoverCircle && !dot.hover) {
			dot.hover = true;

			// bigger dot
			that.drawDot(ctx, dot.pos.x, dot.pos.y, that.hoverRadius, false);

			// card
			that.showDetailCard(dot.pos, index);

			return true;
		}
		
		// mouse leave
		if (!inHoverCircle && dot.hover) {
			dot.hover = false;

			// normal dot
			ctx.clearRect(dot.pos.x - that.hoverRadius, dot.pos.y - that.hoverRadius, that.hoverRadius * 2, that.hoverRadius * 2);
			if (index == that.dots.length - 1) {
				// last dot
				that.drawHorizontalLine(ctx, dot.pos.x - that.hoverRadius, dot.pos.y, that.hoverRadius);
			} else if (index == 0) {
				// first dot
				that.drawHorizontalLine(ctx, dot.pos.x, dot.pos.y, that.hoverRadius);
			} else {
				// middle dot
				that.drawHorizontalLine(ctx, dot.pos.x - that.hoverRadius, dot.pos.y, that.hoverRadius * 2);
			}
			that.drawDot(ctx, dot.pos.x, dot.pos.y, that.radius, false);

			// card
			that.hideDetailCard();

			return true;
		}
	});
};

SessionHistoryKit.SessionHistory.prototype.draw = function() {
	var ctx = this.initCanvas();
	if (!ctx) {
		return;
	}

	var x = this.hoverRadius;
	var y = this.height - 20;
	this.drawStream(ctx, x, y);
};
