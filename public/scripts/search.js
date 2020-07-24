$('#campground-search').on('input', function() {
  var search = $(this).serialize();
  if(search === "search=") {
    search = "all"
  }
  $.get('/campgrounds?' + search, function(data) {
    $('#campground-grid').html('');
    data.forEach(function(campground) {
      $('#campground-grid').append(`
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
        	<div class="card">
            	<img class="card-img-top img-fluid" src="${ campground.image }" alt="${ campground.name }" alt="Responsive image">
            	<div class="card-body">
              		<h5 class="card-title">${ campground.name }</h5>
              		<a href="/campgrounds/${ campground._id }" class="btn btn-primary">More Info</a>
				</div>
          	</div>
        </div>
      `);
    });
  });
});

$('#campground-search').submit(function(event) {
  event.preventDefault();
});