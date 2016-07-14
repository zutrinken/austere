jQuery(function($) {

	var html = $('html');
	var body = $('body');


	/* ==========================================================================
	   Current Menu Item
	   ========================================================================== */

	/*
		Actually this should be handled by GHost itself, but the {{current}} handler doesn't
		work as aspected everytime so I add this little FUnction to fix this on the client side.
	*/

	function currentMenuFix() {
		$('.menu-list-item a').each(function() {
			var link = $(this);
			link.removeClass('current');
			if(link.attr('href') == window.location.href) {
				link.addClass('current');
			}
		});
	}
	currentMenuFix();



	/* ==========================================================================
	   Nav Collapse
	   ========================================================================== */

	/*
		Some description
	*/
	
	var menuWidth = $('#menu').width();

	function navCollapse() {
		html.removeClass('menu-active');

		if (menuWidth > ($(window).width() - 160)) {
			html.addClass('menu-hidden');
		} else {
			html.removeClass('menu-hidden');
			html.removeClass('menu-active');
			$('#menu-button').removeClass('active');
		}
		
	};
	navCollapse();

	$(window).on({
		'resize': function() {
			navCollapse();
		},
		'orientationchange': function() {
			navCollapse();
		}
	});
	
	body.on('click', '#menu-button', function() {
		$(this).toggleClass('active');
		html.toggleClass('menu-active');
	});


	/* ==========================================================================
	   Run Highlight
	   ========================================================================== */

	function highlight() {
		$('pre code').each(function(i, e) {
			hljs.highlightBlock(e);
			var code = $(this);
			var lines = code.html().split(/\n/).length;
			var numbers = [];
			for (i = 1; i < lines; i++) {
				numbers += '<span class="line">' + i + '</span>';
			}
			code.parent().addClass('codeblock').append('<div class="lines">' + numbers + '</div>');
		});
	}
	highlight();

	/* ==========================================================================
	   Fitvids
	   ========================================================================== */

	function video() {
		$('#wrapper').fitVids();
	}
	video();

	/* ==========================================================================
	   Initialize and load Disqus
	   ========================================================================== */

	function comments() {
		if (typeof disqus === 'undefined' || !document.getElementById('disqus_thread')) {
			$('.post-comments').css({
				'display' : 'none'
			});
		} else {
			if (window.DISQUS) {
				return DISQUS.reset({
					reload: true,
					config: function () {
						this.page.identifier = location.pathname;
						this.page.url = location.origin + location.pathname;
					}
				});
			}

			$.ajax({
				type: "GET",
				url: "//" + disqus + ".disqus.com/embed.js",
				dataType: "script",
				cache: true
			});
		}
	}
	comments();

	/* ==========================================================================
	   Reading Time
	   ========================================================================== */

	function readingTime() {
		// Don't execute on the front page
		if (location.pathname === '/') {
			return;
		}

		var post = body.find('article');
		var postReadingTime = post.find('.post-reading-time');

		post.readingTime({
			readingTimeTarget: postReadingTime.find('.estimated-reading-time'),
			wordCountTarget: postReadingTime.find('.word-count'),
			error: function () {
				postReadingTime.find('.post-reading-time').remove();
			}
		});
	}
	readingTime();

	/* ==========================================================================
	   Reload all scripts after AJAX load
	   ========================================================================== */

	function reload() {
		ajaxLinkClass();
		highlight();
		video();
		comments();
		currentMenuFix();
		readingTime();
		navCollapse();
	}

	/* ==========================================================================
	   Add class for ajax loading
	   ========================================================================== */

	function ajaxLinkClass() {

		$('a[href^="' + window.location.origin + '"], .post-image a, .post-title a, .post-more a, .post-meta a, .post-tags a, #pagination a').each(function() {
			var link = $(this);

			if(!link.hasClass('rss')) {
				link.addClass('js-ajax-link');

				if (link.attr('href').indexOf('page') > -1) {
					link.addClass('js-archive-index');
				}

				if (link.attr('href') == window.location.origin) {
					link.addClass('js-show-index');
				}

				if (link.attr('href').indexOf('tag') > -1) {
					link.addClass('js-tag-index');
				}

				if (link.attr('href').indexOf('author') > -1) {
					link.addClass('js-author-index');
				}
			}
		});
	}
	ajaxLinkClass();

	/* ==========================================================================
	   Ajax Loading
	   ========================================================================== */

	var History = window.History;
	var loading = false;
	var ajaxContainer = $('#ajax-container');

	if (!History.enabled) {
		return false;
	}

	History.Adapter.bind(window, 'statechange', function() {
		html.addClass('loading');
		var State = History.getState();
		$.get(State.url, function(result) {
			var $html = $(result);
			var newContent = $('#ajax-container', $html).contents();
			var title = result.match(/<title>(.*?)<\/title>/)[1];

			ajaxContainer.fadeOut(500, function() {
				if(html.hasClass('push-next')) {
					html.removeClass('push-next');
					html.addClass('pushed-next');
				}
				if(html.hasClass('push-prev')) {
					html.removeClass('push-prev');
					html.addClass('pushed-prev');
				}
				document.title = $('<textarea/>').html(title).text();
				ajaxContainer.html(newContent);
				body.removeClass();
				body.addClass($('#body-class').attr('class'));
				NProgress.done();
				ajaxContainer.fadeIn(500);
				$(document).scrollTop(0);
				setTimeout(function() {
					html.removeClass('loading');
				}, 50);
				reload();
				loading = false;
			});
		});
	});
	body.on('click', '.js-ajax-link', function(e) {
	    e.preventDefault();

		var link = $(this);

		if(link.hasClass('post-nav-item') || link.hasClass('pagination-item')) {
			if(link.hasClass('post-nav-next') || link.hasClass('pagination-next')) {
				html.removeClass('pushed-prev');
				html.addClass('push-next');
			}
			if(link.hasClass('post-nav-prev') || link.hasClass('pagination-prev')) {
				html.removeClass('pushed-next');
				html.addClass('push-prev');
			}
		} else {
			html.removeClass('pushed-next');
			html.removeClass('pushed-prev');
		}

	    if (loading === false) {
			var currentState = History.getState();
			var url = $(this).prop('href');
			var title = $(this).attr('title') || null;

	        if (url.replace(/\/$/, "") !== currentState.url.replace(/\/$/, "")) {
				loading = true;
				html.addClass('loading');
				NProgress.start();
				History.pushState({}, title, url);
	        }
	    }
	});

	body.on('click', '#post-index .post .js-ajax-link', function() {
		var post = $(this).parents('.post');
		post.addClass('initial');
		setTimeout(function() {
			post.addClass('active');
		}, 1);
	});
});
