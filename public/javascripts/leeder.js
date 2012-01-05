(function(){
  var Leeder = function() {
    var current_entry = null;
    var current_feed = null;
    var shift = false;

    $(document).bind("keypress", function(e) {
      console.log(e.keyCode);
      if (e.keyCode == 106) {
        var next = current_entry ? current_entry.next()
                 : $("#entries").children("li").first();
        if (next.size()) selectEntry(next.get(0).id);
      }
      else if (e.keyCode == 107) {
        var prev = current_entry ? current_entry.prev()
                 : $("#entries").children("li").last();
        if (prev.size()) selectEntry(prev.get(0).id);
      }
      else if (e.keyCode == 74) {
        var next = current_feed ? current_feed.next()
                 : $('#feeds').children("li").first();
        if (next.size()) selectFeed(next.get(0).id);
      }
      else if (e.keyCode == 75) {
        var prev = current_feed ? current_feed.prev()
                 : $('#feeds').children("li").last();
        if (prev.size()) selectFeed(prev.get(0).id);
      }
      else if (current_entry != null) {
        if (e.keyCode == 118) {
          var href = current_entry.children("h3").find("a").attr("href");
          if (href) window.open(href);
        }
        else if (e.keyCode == 115) {
          saveEntry(current_entry.get(0).id);
        }
      }
    });
    
    $("#add_feed").bind("click", function(e) {
      var form = $("#new_feed");
      if (form.hasClass("visible")) {
        form.removeClass("visible");
        $(this).html("+");
      }
      else {
        form.addClass("visible");
        $(this).html("&ndash;");
        form.get(0).elements['url'].focus();
      }
    });

    $("#new_feed").bind("submit", function(e) {
      e.preventDefault();
      var form = $(this);
      var input = $(this.elements['url']);
      $.ajax({
        type: "POST",
        url: "/api/feed",
        data: {url: input.val()},
        dataType: "json",
        success: function(feed) {
          input.val("");
          form.removeClass("visible");
          $("#add_feed").html("+");
          $("#feeds").append('<li id="'+feed.id+'">'+feed.name+'</li>');
        }
      });
    });

    $("#feeds").on("click", "li:not(.selected)", function (){
      selectFeed(this.id);
    });

    var selectFeed = function(id) {
      var li = $('#'+id);
      li.parents("ul").find(".selected").removeClass("selected");
      li.addClass("selected");
      window.scrollTo(0,0);
      current_entry = null;
      current_feed = li;
      $("#entries_title").html(li.html());        
      getFeed(id);
    };

    var selectEntry = function(id) {
      var li = $('#'+id);
      li.parents("ul").find(".selected").removeClass("selected");
      li.addClass("selected");

      window.scrollTo(0, li.get(0).offsetTop - 26);
      current_entry = li;

      if (!li.hasClass("read")) {
        $.ajax({
          type: "POST",
          url: "/api/entry/" + id,
          data: {read: 1},
          dataType: "json",
          success: function(){ li.addClass("read") }
        });
      }
    };

    var saveEntry = function(id) {
      var li = $('#'+id);
      var save = li.find(".save_entry");
      save.html("saving to pinboard");
      $.ajax({
        type: "POST",
        url: "/api/entry/" + id,
        data: {saved: 1},
        dataType: "json",
        success: function(){
          li.addClass("saved")
          save.html("saved to pinboard");
        }
      });
    };

    $("#entries").on("click", "li:not(.selected)", function(e) {
      e.preventDefault();
      $(this).parents("ul").find("li").removeClass("selected");
      selectEntry(this.id);
    });

    $("#entries").on("click", "button.save_entry", function(e) {
      e.preventDefault();
      saveEntry($(this).parents("li").get(0).id);
    });
    
    var getFeed = function(id) {
      var list = $("#entries");
      $.getJSON("/api/feed/"+id, function(entries) {
        list.html("");
        $(entries).each(function(i,entry) {
          var meta = (entry.author ? entry.author+"&mdash;" : "")
                   + (entry.issued ? new Date(entry.issued * 1000) : "");
          var html = '<li id="'+entry.id+'" class="'+(entry.read ? "read" : "unread")+'">'
                   + '<h3><a href="'+entry.link+'" target="_blank">'
                   + entry.title +'</a></h3>'
                   + '<div class="meta">'+meta+'</div>'
                   + '<button class="save_entry">'
                     + (entry.saved ? "saved" : "save")
                     + ' to pinboard</button>'
                   + '<div class="body">'+entry.content+'</div>'
                   + '</li>';
          list.append(html);
        });
      });
    };

    var refreshFeeds = function() {
      $.getJSON("/api/feeds", function(feeds) {
        $(feeds).each(function(i, feed) {
          if (!$('#'+feed.id).size()) {
            $('#feeds').append('<li id="'+feed.id+'">'+feed.name+'</li>');
          }
        });
      });
    };

    this.refreshFeeds = refreshFeeds;
    this.selectFeed = selectFeed;
  };

  $(document).ready(function(){
    var leeder = new Leeder();
    leeder.refreshFeeds();
    leeder.select
  })

})();
