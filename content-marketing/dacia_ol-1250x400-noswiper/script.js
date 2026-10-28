(function () {
  var track = document.querySelector(".slider-track");
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var prevBtn = document.querySelector(".nav-btn--prev");
  var nextBtn = document.querySelector(".nav-btn--next");
  // Config
  var slideWidth = 300;
  var gap = 10;
  var step = slideWidth + gap; // 310
  var visibleSlides = 3;
  var speed = 500;
  var delay = 2000;
  // Clone for infinite loop
  var firstClones = [];
  var lastClones = [];
  for (var i = 0; i < visibleSlides; i++) {
    firstClones.push(slides[i].cloneNode(true));
  }
  for (var i = slides.length - visibleSlides; i < slides.length; i++) {
    lastClones.push(slides[i].cloneNode(true));
  }
  for (var i = 0; i < firstClones.length; i++) {
    track.appendChild(firstClones[i]);
  }
  for (var i = lastClones.length - 1; i >= 0; i--) {
    track.insertBefore(lastClones[i], track.firstChild);
  }
  var currentIndex = visibleSlides; // start at original first slide
  var isAnimating = false;
  var autoPlayInterval;
  function updatePosition(animate) {
    if (animate) {
      track.style.transition = "transform " + speed + "ms ease";
    } else {
      track.style.transition = "none";
    }
    track.style.transform = "translateX(-" + currentIndex * step + "px)";
  }
  // Init
  updatePosition(false);
  function moveToNext() {
    if (isAnimating) return;
    isAnimating = true;
    currentIndex++;
    updatePosition(true);
  }
  function moveToPrev() {
    if (isAnimating) return;
    isAnimating = true;
    currentIndex--;
    updatePosition(true);
  }
  track.addEventListener("transitionend", function () {
    isAnimating = false;
    // Jump to original slides smoothly
    if (currentIndex >= slides.length + visibleSlides) {
      currentIndex = currentIndex - slides.length;
      updatePosition(false);
    } else if (currentIndex < visibleSlides) {
      currentIndex = currentIndex + slides.length;
      updatePosition(false);
    }
  });
  nextBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    moveToNext();
    resetAutoPlay();
  });
  prevBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    moveToPrev();
    resetAutoPlay();
  });
  // Universal Touch / Swipe / Mouse Drag controls
  var startX = 0;
  var startTranslateX = 0;
  var currentX = 0;
  var isDragging = false;
  var dragged = false;
  function getTranslateX() {
    var style = window.getComputedStyle(track);
    // Fallback for older browsers
    var matrix = new window.WebKitCSSMatrix(style.transform === "none" ? "" : style.transform);
    return matrix.m41;
  }
  function dragStart(e) {
    if (e.type === "mousedown") {
      e.preventDefault(); // prevent native image dragging/highlighting
    }
    isDragging = true;
    dragged = false;
    startX = e.type.includes("mouse") ? e.pageX : e.touches[0].clientX || e.touches[0].pageX;
    currentX = startX;
    startTranslateX = getTranslateX();
    stopAutoPlay();
    track.style.transition = "none";
    isAnimating = false; // Allow interrupting an ongoing animation
  }
  function dragMove(e) {
    if (!isDragging) return;
    currentX = e.type.includes("mouse") ? e.pageX : e.touches[0].clientX || e.touches[0].pageX;
    var diff = currentX - startX;
    if (Math.abs(diff) > 5) {
      dragged = true; // Mark as dragged to prevent clicks
    }
    track.style.transform = "translateX(" + (startTranslateX + diff) + "px)";
  }
  function dragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    var diff = currentX - startX;
    var fraction = -(startTranslateX + diff) / step;
    if (diff < -30) {
      currentIndex = Math.ceil(fraction);
    } else if (diff > 30) {
      currentIndex = Math.floor(fraction);
    } else {
      currentIndex = Math.round(fraction);
    }
    updatePosition(true);
    startAutoPlay();
  }
  // Add Touch Events
  track.addEventListener("touchstart", dragStart, { passive: true });
  track.addEventListener("touchmove", dragMove, { passive: true });
  track.addEventListener("touchend", dragEnd);
  // Add Mouse Events
  track.addEventListener("mousedown", dragStart);
  window.addEventListener("mousemove", dragMove);
  window.addEventListener("mouseup", dragEnd);
  // Prevent click if we dragged
  var allSlides = document.querySelectorAll(".slide");
  for (var j = 0; j < allSlides.length; j++) {
    allSlides[j].addEventListener(
      "click",
      function (e) {
        if (dragged) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );
  }
  function startAutoPlay() {
    autoPlayInterval = setInterval(moveToNext, delay);
  }
  function stopAutoPlay() {
    clearInterval(autoPlayInterval);
  }
  function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }
  // Start autoplay on load
  startAutoPlay();
})();
