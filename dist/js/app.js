const BACKEND_API_URL = "http://localhost:3000/api";

$(document).ready(function () {
  var $grid;
  var lightGalleryInstance = null;

  // Delegate event handler for filter clicks
  $(document).on("click", "#gallery_content li", function () {
    var filterValue = $(this).attr("data-filter");
    $("#gallery_content li").removeClass("active");
    $(this).addClass("active");
    
    console.log("Filter value:", filterValue);
    
    // Apply isotope filter with a forced relayout
    $grid.isotope({ 
      filter: filterValue 
    });
  });

  function loadedGallery() {
    $.get(`${BACKEND_API_URL}/gallery`)
      .then((res) => {
        let li_data = `<li data-filter="*" class="active">All</li>`;
        let image_data = "";
        const uniqueCategories = new Set();

        if (res.length > 0) {
          // First add a grid-sizer element
          image_data = '<div class="grid-sizer"></div>';
          
          res.forEach((gallery) => {
            // Sanitize category name for CSS class
            const categoryClass = gallery.categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            
            uniqueCategories.add({
              name: gallery.categoryName,
              className: categoryClass
            });

            // Use the grid-item class and the category class ONLY
            image_data += `
              <div class="grid-item ${categoryClass}">
                <a href="${BACKEND_API_URL}/uploads/${gallery.image}" class="gripImg">
                  <img class="gripImg_img" src="${BACKEND_API_URL}/uploads/${gallery.image}" alt="${gallery.imageTitle}" />
                </a>
              </div>`;
          });

          // Convert Set to Array for processing
          const categoriesArray = Array.from(uniqueCategories);
          
          categoriesArray.forEach((category) => {
            li_data += `<li data-filter=".${category.className}">${category.name}</li>`;
          });

          $("#gallery_content").html(li_data);
          $("#lightgallery").html(image_data);

          // Make sure to destroy any existing Isotope instance
          if ($grid) {
            $grid.isotope('destroy');
          }

          // Initialize Isotope with explicit column width settings 
          $grid = $("#lightgallery").isotope({
            itemSelector: '.grid-item',
            percentPosition: true,
            layoutMode: 'fitRows',
            fitRows: {
              gutter: 20
            },
            columnWidth: '.grid-sizer'
          });

          // Layout Isotope after images have loaded
          $grid.imagesLoaded().progress(function () {
            $grid.isotope('layout');
          });

          if (lightGalleryInstance) {
            lightGalleryInstance.destroy();
          }

          lightGalleryInstance = lightGallery(
            document.getElementById("lightgallery"),
            {
              selector: ".gripImg",
              plugins: [lgZoom, lgThumbnail],
              speed: 500,
              download: false,
              counter: true,
              thumbnail: true,
              animateThumb: true,
              zoomFromOrigin: true,
              allowMediaOverlap: true,
            }
          );
        }
      })
      .catch((error) => {
        console.error("Error loading gallery:", error);
      });
  }

  loadedGallery();
  
  // Handle window resize for recalculation
  $(window).on('resize', function() {
    if ($grid) {
      $grid.isotope('layout');
    }
  });
});