(function(){
  var Leeder = function() {
    var current_entry = null;
    var current_feed = null;
    var show_unread = false;
    var shift = false;

    $(document).bind("keypress", function(e) {
      console.log(e.keyCode);
      // j or n
      if (e.keyCode == 106 || e.keyCode == 110) {
        var next = current_entry ? current_entry.next()
                 : $("#entries").children("li").first();
        if (next.size()) selectEntry(next.get(0).id);
      }
      
      // k or p
      else if (e.keyCode == 107 || e.keyCode == 112) {
        var prev = current_entry ? current_entry.prev()
                 : $("#entries").children("li").last();
        if (prev.size()) selectEntry(prev.get(0).id);
      }

      
      // J or N
      else if (e.keyCode == 74 || e.keyCode == 78) {
        var next = $('#feeds').find("li.highlighted").first().next();
        if (!next.size()) next = $('#feeds').find("li").first()
        if (next.size()) {
          $('#feeds').find("li.highlighted").removeClass("highlighted");
          next.addClass("highlighted");
        }
      }

      // K or P
      else if (e.keyCode == 75 || e.keyCode == 80) {
        var prev = $('#feeds').find("li.highlighted").first().prev();
        if (!prev.size()) prev = $('#feeds').find("li").last();
        if (prev.size()) {
          $('#feeds').find("li.highlighted").removeClass("highlighted");
          prev.addClass("highlighted");
        }
      }

      // O
      else if (e.keyCode == 79) {
        var highlighted = $('#feeds').find('li.highlighted').first();
        if (highlighted.size()) {
          selectFeed(highlighted.get(0).id);
        }
      }
      else if (current_entry != null) {
        // v
        if (e.keyCode == 118) {
          var href = current_entry.children("h3").find("a").attr("href");
          if (href) window.open(href);
        }
        
        // s
        else if (e.keyCode == 115) {
          saveEntry(current_entry.get(0).id);
        }
        
        // m
        else if (e.keyCode == 109) {
          var read = !current_entry.hasClass("read");
          setRead(current_entry.get(0).id, read);
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
    
    $("#entries").on("click", "div.body a", function(e) {
      e.preventDefault();
      window.open($(this).attr("href"));
    });

    $('#show_unread').bind("click", function() {
      var node = $(this);
      if (node.text() == "show all") {
        show_unread = true;
        node.text("hide unread");
        getFeed(current_feed.get(0).id);
      }
      else {
        show_unread = false;
        node.text("show all");
        $("#entries").find("li.read").remove();
      }
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
      setRead(id, true);
    };

    var setRead = function(id, read) {
      var li = $('#'+id);

      var current = li.hasClass('read');
      if (read == current) return;
 
      $.ajax({
        type: "POST",
        url: "/api/entry/" + id,
        data: {read: (read ? "1" : "0")},
        dataType: "json",
        success: function(){
          read ? li.addClass("read") : li.removeClass("read");
        }
      });
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
      var url = "/api/feed/"+id+"?show_unread="+(show_unread ? "1" : "0");
      $.getJSON(url, function(entries) {
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
