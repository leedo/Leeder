(function(){
  var Leeder = function() {
    var current_entry = null;

    $(document).bind("keypress", function(e) {
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
      current_entry = null;
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

    $("#entries").on("click", "li:not(.selected)", function(e) {
      e.preventDefault();
      $(this).parents("ul").find("li").removeClass("selected");
      selectEntry(this.id);
    });
    
    var getFeed = function(id) {
      var list = $("#entries");
      $.getJSON("/api/feed/"+id, function(entries) {
        list.html("");
        $(entries).each(function(i,entry) {
          var meta = (entry.author ? entry.author+"&mdash;" : "")
                   + (entry.issued ? entry.issued : "");
          var html = '<li id="'+entry.id+'" class="'+(entry.read ? "read" : "unread")+'">'
                   + '<h3><a href="'+entry.link+'" target="_blank">'
                   + entry.title +'</a></h3>'
                   + '<div class="meta">'+meta+'</div>'
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
