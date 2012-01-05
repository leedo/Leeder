(function(){
  var Leeder = function() {
    var current_entry = null;

    $(document).bind("keypress", function(e) {
      if (e.keyCode == 106) {
        var next = current_entry ? current_entry.next()
                 : $("#entries").children("li").first();
        if (next.size()) selectEntry(next);
      }
      else if (e.keyCode == 107) {
        var prev = current_entry ? current_entry.prev()
                 : $("#entries").children("li").last();
        if (prev.size()) selectEntry(prev);
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
      }
    });

    $("#new_feed").bind("submit", function(e) {
      e.preventDefault();
      var form = $(this);
      var input = $(this.elements['url']);
      $.ajax({
        type: "POST",
        url: "/api/feed",
        data: {url: input.attr("value")},
        dataType: "json",
        success: function(feed) {
          input.attr("value", "");
          form.removeClass("visible");
          $("#feeds").append('<li id="'+feed.id+'">'+feed.name+'</li>');
        }
      });
    });

    $("#feeds").on("click", "li:not(.selected)", function (){
      var li = $(this);
      li.parents("ul").find(".selected").removeClass("selected");
      li.addClass("selected");
      current_entry = null;
      $("#entries_title").html(li.html());        
      getFeed(li.get(0).id);
    });

    var selectEntry = function(node) {
      node.parents("ul").find(".selected").removeClass("selected");
      node.addClass("selected");
      window.scrollTo(0, node.get(0).offsetTop - 26);
      current_entry = node;
      var id = node.get(0).id;
      $.ajax({
        type: "POST",
        url: "/api/entry/" + id,
        data: {read: 1},
        dataType: "json",
        success: function(res) {
          console.log(res);
        }
      });
    };

    $("#entries").on("click", "li:not(.selected)", function(e) {
      e.preventDefault();
      var li = $(this);
      li.parents("ul").find("li").removeClass("selected");
      selectEntry(li);
    });
    
    var getFeed = function(id) {
      var list = $("#entries");
      $.getJSON("/api/feed/"+id, function(entries) {
        list.html("");
        $(entries).each(function(i,entry) {
          var meta = (entry.author ? entry.author : "")
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
  };

  $(document).ready(function(){
    var leeder = new Leeder();
    leeder.refreshFeeds();
  })

})();
