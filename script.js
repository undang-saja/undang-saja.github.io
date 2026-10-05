(function () {
  function getGuestName() {
    var params = new URLSearchParams(window.location.search);
    var raw = params.get("to") || "";
    if (!raw) { return ""; }
    try {
      return decodeURIComponent(raw);
    } catch (e) {
      return raw;
    }
  }

  var guestNameFromUrl = getGuestName();

  var root = document.documentElement;
  var cover = document.getElementById("cover");
  var openBtn = document.getElementById("openInvitation");
  var revealEls = document.querySelectorAll(".reveal");
  var wishForm = document.getElementById("wishForm");
  var wishList = document.getElementById("wishList");
  var countdownRoot = document.getElementById("countdown");
  var quickNavLinks = document.querySelectorAll(".quick-nav-link[data-target]");
  var gallerySlider = document.getElementById("gallerySlider");
  var musicToggle = document.getElementById("musicToggle");
  var autoScrollToggle = document.getElementById("autoScrollToggle");
  var bgMusic = document.getElementById("bgMusic");
  var isMusicOn = false;
  var isAutoScrolling = false;
  var autoScrollTimer = null;
  var autoScrollTargetIds = [];
  var sectionPagerIds = [];
  var sectionPagerLocked = false;
  var touchPageStartX = 0;
  var touchPageStartY = 0;

  function setMusicButtonState(isOn) {
    if (!musicToggle) {
      return;
    }

    musicToggle.classList.toggle("active", isOn);
    musicToggle.setAttribute("aria-pressed", isOn ? "true" : "false");
    musicToggle.setAttribute("aria-label", isOn ? "Music on" : "Music off");
    musicToggle.setAttribute("title", isOn ? "Music: On" : "Music: Off");
  }

  function setAutoScrollButtonState(isOn) {
    if (!autoScrollToggle) {
      return;
    }

    autoScrollToggle.classList.toggle("active", isOn);
    autoScrollToggle.setAttribute("aria-pressed", isOn ? "true" : "false");
    autoScrollToggle.setAttribute("aria-label", isOn ? "Auto scroll on" : "Auto scroll off");
    autoScrollToggle.setAttribute("title", isOn ? "Auto Scroll: On" : "Auto Scroll: Off");
  }

  function stopAutoScroll() {
    if (autoScrollTimer !== null) {
      window.clearTimeout(autoScrollTimer);
      autoScrollTimer = null;
    }
    isAutoScrolling = false;
    setAutoScrollButtonState(false);
  }

  function getReadableTextLength(sectionEl) {
    if (!sectionEl) {
      return 0;
    }

    return (sectionEl.innerText || sectionEl.textContent || "").replace(/\s+/g, " ").trim().length;
  }

  function getSectionReadDelay(sectionEl) {
    var textLength = getReadableTextLength(sectionEl);
    var heightFactor = sectionEl ? Math.min(sectionEl.offsetHeight / 900, 1.4) : 0;
    var calculatedDelay = 2600 + (textLength * 13) + (heightFactor * 900);

    return Math.min(Math.max(calculatedDelay, 3600), 9000);
  }

  function getCurrentSectionIndex() {
    if (!autoScrollTargetIds.length) {
      return -1;
    }

    var viewportAnchor = window.scrollY + Math.max(window.innerHeight * 0.32, 120);
    var currentIndex = 0;

    for (var i = 0; i < autoScrollTargetIds.length; i += 1) {
      var sectionEl = document.getElementById(autoScrollTargetIds[i]);
      if (!sectionEl) {
        continue;
      }

      if (sectionEl.offsetTop <= viewportAnchor) {
        currentIndex = i;
      }
    }

    return currentIndex;
  }

  function scheduleNextSection() {
    if (!isAutoScrolling) {
      return;
    }

    var currentIndex = getCurrentSectionIndex();
    var nextIndex = currentIndex + 1;

    if (nextIndex >= autoScrollTargetIds.length) {
      stopAutoScroll();
      return;
    }

    var currentSection = document.getElementById(autoScrollTargetIds[currentIndex]);
    var delay = getSectionReadDelay(currentSection);

    autoScrollTimer = window.setTimeout(function () {
      var nextSection = document.getElementById(autoScrollTargetIds[nextIndex]);

      if (!isAutoScrolling || !nextSection) {
        stopAutoScroll();
        return;
      }

      goToSection(nextIndex);

      autoScrollTimer = window.setTimeout(scheduleNextSection, 1200);
    }, delay);
  }

  function startAutoScroll() {
    if (autoScrollTimer !== null || isAutoScrolling) {
      return;
    }

    buildSectionPagerIds();

    if (!autoScrollTargetIds.length) {
      return;
    }

    isAutoScrolling = true;
    setAutoScrollButtonState(true);
    scheduleNextSection();
  }

  function toggleAutoScroll() {
    if (isAutoScrolling) {
      stopAutoScroll();
      return;
    }
    startAutoScroll();
  }

  function stopByUserIntent() {
    if (isAutoScrolling) {
      stopAutoScroll();
    }
  }

  function tryPlayMusic() {
    if (!bgMusic) {
      return;
    }

    var playAttempt = bgMusic.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.then(function () {
        isMusicOn = true;
        setMusicButtonState(true);
      }).catch(function () {
        isMusicOn = false;
        setMusicButtonState(false);
      });
      return;
    }

    isMusicOn = true;
    setMusicButtonState(true);
  }

  function toggleMusic() {
    if (!bgMusic) {
      return;
    }

    if (isMusicOn) {
      bgMusic.pause();
      isMusicOn = false;
      setMusicButtonState(false);
      return;
    }

    tryPlayMusic();
  }

  function updateScrollProgress() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    root.style.setProperty("--scroll-progress", progress.toFixed(2));
  }

  function buildSectionPagerIds() {
    var ids = [];

    for (var i = 0; i < quickNavLinks.length; i += 1) {
      var targetId = quickNavLinks[i].getAttribute("data-target");
      if (targetId && document.getElementById(targetId) && ids.indexOf(targetId) === -1) {
        ids.push(targetId);
      }
    }

    if (document.getElementById("closing")) {
      ids.push("closing");
    }

    sectionPagerIds = ids;
    autoScrollTargetIds = ids.slice();
  }

  function getNearestSectionIndex() {
    if (!sectionPagerIds.length) {
      return 0;
    }

    var viewportCenter = window.scrollY + (window.innerHeight * 0.42);
    var bestIndex = 0;
    var bestDistance = Infinity;

    for (var i = 0; i < sectionPagerIds.length; i += 1) {
      var sectionEl = document.getElementById(sectionPagerIds[i]);
      if (!sectionEl) {
        continue;
      }

      var distance = Math.abs(sectionEl.offsetTop - viewportCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }

    return bestIndex;
  }

  function canScrollInside(target, direction) {
    var node = target;

    while (node && node !== document.body && node !== document.documentElement) {
      if (node.scrollHeight > node.clientHeight + 2) {
        var maxScrollTop = node.scrollHeight - node.clientHeight;
        if (direction > 0 && node.scrollTop < maxScrollTop - 2) {
          return true;
        }
        if (direction < 0 && node.scrollTop > 2) {
          return true;
        }
      }

      node = node.parentElement;
    }

    return false;
  }

  function isTypingTarget(target) {
    if (!target) {
      return false;
    }

    var tagName = target.tagName ? target.tagName.toLowerCase() : "";
    return tagName === "input" || tagName === "textarea" || tagName === "select" || tagName === "button" || tagName === "a" || target.isContentEditable;
  }

  function goToSection(index) {
    if (!sectionPagerIds.length || sectionPagerLocked) {
      return;
    }

    var nextIndex = Math.min(Math.max(index, 0), sectionPagerIds.length - 1);
    var targetId = sectionPagerIds[nextIndex];
    var targetEl = document.getElementById(targetId);

    if (!targetEl) {
      return;
    }

    sectionPagerLocked = true;
    targetEl.scrollTop = 0;
    targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    targetEl.classList.add("show");

    if (targetId !== "closing") {
      setActiveQuickNav(targetId);
    }

    updateScrollProgress();

    window.setTimeout(function () {
      sectionPagerLocked = false;
    }, 950);
  }

  function goToAdjacentSection(direction) {
    var currentIndex = getNearestSectionIndex();
    goToSection(currentIndex + direction);
  }

  function handlePagedWheel(event) {
    if (!document.body.classList.contains("invitation-open")) {
      return;
    }

    var direction = event.deltaY > 0 ? 1 : -1;

    if (Math.abs(event.deltaY) < 18 || isTypingTarget(event.target)) {
      return;
    }

    if (canScrollInside(event.target, direction)) {
      stopByUserIntent();
      return;
    }

    event.preventDefault();
    stopByUserIntent();
    goToAdjacentSection(direction);
  }

  function handlePagedTouchStart(event) {
    if (!event.touches || !event.touches.length) {
      return;
    }

    touchPageStartX = event.touches[0].clientX;
    touchPageStartY = event.touches[0].clientY;
  }

  function handlePagedTouchEnd(event) {
    if (!document.body.classList.contains("invitation-open") || !event.changedTouches || !event.changedTouches.length) {
      return;
    }

    var deltaX = event.changedTouches[0].clientX - touchPageStartX;
    var deltaY = event.changedTouches[0].clientY - touchPageStartY;
    var direction = deltaY < 0 ? 1 : -1;

    if (Math.abs(deltaY) < 54 || Math.abs(deltaY) < Math.abs(deltaX) * 1.25 || isTypingTarget(event.target)) {
      return;
    }

    if (canScrollInside(event.target, direction)) {
      stopByUserIntent();
      return;
    }

    stopByUserIntent();
    goToAdjacentSection(direction);
  }

  function handlePagedKeydown(event) {
    if (!document.body.classList.contains("invitation-open") || isTypingTarget(event.target)) {
      stopByUserIntent();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      stopByUserIntent();
      goToAdjacentSection(1);
    } else if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      stopByUserIntent();
      goToAdjacentSection(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      stopByUserIntent();
      goToSection(0);
    } else if (event.key === "End") {
      event.preventDefault();
      stopByUserIntent();
      goToSection(sectionPagerIds.length - 1);
    }
  }

  function setActiveQuickNav(targetId) {
    if (!quickNavLinks.length) {
      return;
    }

    for (var i = 0; i < quickNavLinks.length; i += 1) {
      var isActive = quickNavLinks[i].getAttribute("data-target") === targetId;
      quickNavLinks[i].classList.toggle("active", isActive);
      quickNavLinks[i].setAttribute("aria-current", isActive ? "page" : "false");
    }
  }

  function initQuickNav() {
    if (!quickNavLinks.length) {
      return;
    }

    var ids = [];

    for (var i = 0; i < quickNavLinks.length; i += 1) {
      (function (link) {
        var targetId = link.getAttribute("data-target");
        var targetEl = document.getElementById(targetId);

        if (targetEl) {
          ids.push(targetId);
        }

        link.addEventListener("click", function (event) {
          if (!targetEl) {
            return;
          }

          event.preventDefault();
          stopByUserIntent();
          goToSection(sectionPagerIds.indexOf(targetId));
        });
      })(quickNavLinks[i]);
    }

    if (!ids.length) {
      return;
    }

    if ("IntersectionObserver" in window) {
      var quickNavObserver = new IntersectionObserver(function (entries) {
        var bestEntry = null;

        for (var j = 0; j < entries.length; j += 1) {
          if (!entries[j].isIntersecting) {
            continue;
          }

          if (!bestEntry || entries[j].intersectionRatio > bestEntry.intersectionRatio) {
            bestEntry = entries[j];
          }
        }

        if (bestEntry) {
          setActiveQuickNav(bestEntry.target.id);
        }
      }, {
        threshold: [0.2, 0.4, 0.6],
        rootMargin: "-20% 0px -55% 0px"
      });

      for (var k = 0; k < ids.length; k += 1) {
        var sectionEl = document.getElementById(ids[k]);
        if (sectionEl) {
          quickNavObserver.observe(sectionEl);
        }
      }
    }

    setActiveQuickNav(ids[0]);
  }

  function openInvitation() {
    document.body.classList.add("invitation-open");
    cover.classList.add("hidden");
    document.body.style.overflow = "auto";
    tryPlayMusic();
    window.setTimeout(function () {
      goToSection(0);
    }, 80);
    window.setTimeout(function () {
      cover.setAttribute("aria-hidden", "true");
    }, 450);
  }

  function revealOnScroll() {
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries, obs) {
        for (var i = 0; i < entries.length; i += 1) {
          if (entries[i].isIntersecting) {
            entries[i].target.classList.add("show");
            obs.unobserve(entries[i].target);
          }
        }
      }, {
        threshold: 0.14,
        rootMargin: "0px 0px -30px 0px"
      });

      for (var j = 0; j < revealEls.length; j += 1) {
        observer.observe(revealEls[j]);
      }
      return;
    }

    var trigger = window.innerHeight * 0.9;
    for (var k = 0; k < revealEls.length; k += 1) {
      var rect = revealEls[k].getBoundingClientRect();
      if (rect.top < trigger) {
        revealEls[k].classList.add("show");
      }
    }
  }

  function initGallerySlider() {
    if (!gallerySlider) {
      return;
    }

    var track = gallerySlider.querySelector(".gallery-track");
    var viewport = gallerySlider.querySelector(".gallery-viewport");
    var prevBtn = gallerySlider.querySelector(".gallery-control--prev");
    var nextBtn = gallerySlider.querySelector(".gallery-control--next");
    var dotsRoot = gallerySlider.querySelector(".gallery-dots");
    var slides = track ? track.querySelectorAll(".gallery-item") : [];
    var currentIndex = 0;
    var pageCount = 1;
    var touchStartX = 0;
    var touchDeltaX = 0;

    if (!track || !viewport || !slides.length) {
      return;
    }

    function getGap() {
      var style = window.getComputedStyle(track);
      return parseFloat(style.columnGap || style.gap || "0") || 0;
    }

    function getVisibleCount() {
      var slideWidth = slides[0].getBoundingClientRect().width;
      var viewportWidth = viewport.getBoundingClientRect().width;
      var gap = getGap();

      if (!slideWidth) {
        return 1;
      }

      return Math.max(1, Math.round((viewportWidth + gap) / (slideWidth + gap)));
    }

    function getMaxIndex() {
      return Math.max(slides.length - getVisibleCount(), 0);
    }

    function renderDots() {
      if (!dotsRoot) {
        return;
      }

      pageCount = getMaxIndex() + 1;
      dotsRoot.innerHTML = "";

      for (var i = 0; i < pageCount; i += 1) {
        var dot = document.createElement("button");
        dot.className = "gallery-dot";
        dot.type = "button";
        dot.setAttribute("aria-label", "Tampilkan foto galeri " + (i + 1));

        (function (targetIndex) {
          dot.addEventListener("click", function () {
            goToSlide(targetIndex);
          });
        })(i);

        dotsRoot.appendChild(dot);
      }
    }

    function updateSlider() {
      var maxIndex = getMaxIndex();
      var slideWidth = slides[0].getBoundingClientRect().width;
      var dots = dotsRoot ? dotsRoot.querySelectorAll(".gallery-dot") : [];

      currentIndex = Math.min(Math.max(currentIndex, 0), maxIndex);
      var offset = currentIndex * (slideWidth + getGap());
      track.style.transform = "translateX(-" + offset + "px)";

      if (prevBtn) {
        prevBtn.disabled = pageCount <= 1;
      }

      if (nextBtn) {
        nextBtn.disabled = pageCount <= 1;
      }

      for (var i = 0; i < dots.length; i += 1) {
        dots[i].classList.toggle("active", i === currentIndex);
        dots[i].setAttribute("aria-current", i === currentIndex ? "true" : "false");
      }
    }

    function goToSlide(index) {
      var maxIndex = getMaxIndex();
      currentIndex = Math.min(Math.max(index, 0), maxIndex);
      updateSlider();
    }

    function goToPrevious() {
      var maxIndex = getMaxIndex();
      goToSlide(currentIndex <= 0 ? maxIndex : currentIndex - 1);
    }

    function goToNext() {
      var maxIndex = getMaxIndex();
      goToSlide(currentIndex >= maxIndex ? 0 : currentIndex + 1);
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", goToPrevious);
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", goToNext);
    }

    viewport.addEventListener("touchstart", function (event) {
      touchStartX = event.touches[0].clientX;
      touchDeltaX = 0;
    }, { passive: true });

    viewport.addEventListener("touchmove", function (event) {
      touchDeltaX = event.touches[0].clientX - touchStartX;
    }, { passive: true });

    viewport.addEventListener("touchend", function () {
      if (Math.abs(touchDeltaX) < 42) {
        return;
      }

      if (touchDeltaX < 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    });

    window.addEventListener("resize", function () {
      renderDots();
      goToSlide(currentIndex);
    });

    renderDots();
    updateSlider();
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function updateCountdown() {
    if (!countdownRoot) {
      return;
    }

    var targetDate = new Date("2026-07-04T09:00:00+07:00");
    var now = new Date();
    var diff = targetDate.getTime() - now.getTime();

    var daysEl = countdownRoot.querySelector('[data-role="days"]');
    var hoursEl = countdownRoot.querySelector('[data-role="hours"]');
    var minutesEl = countdownRoot.querySelector('[data-role="minutes"]');
    var secondsEl = countdownRoot.querySelector('[data-role="seconds"]');

    if (diff <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      return;
    }

    var totalSeconds = Math.floor(diff / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  }

  var LS_KEY = "rsvp_local";

  function renderWishItem(entry) {
    var item = document.createElement("div");
    item.className = "wish-item";

    var header = document.createElement("div");
    header.className = "wish-item-header";

    var nameEl = document.createElement("strong");
    nameEl.className = "wish-item-name";
    nameEl.textContent = entry.name;
    header.appendChild(nameEl);

    var badge = document.createElement("span");
    badge.className = "wish-item-badge " + (entry.rsvp === "hadir" ? "badge-hadir" : "badge-tidak");
    badge.textContent = entry.rsvp === "hadir" ? "Hadir" : "Tidak Hadir";
    header.appendChild(badge);

    item.appendChild(header);

    if (entry.ucapan) {
      var ucapanEl = document.createElement("p");
      ucapanEl.className = "wish-item-ucapan";
      ucapanEl.textContent = entry.ucapan;
      item.appendChild(ucapanEl);
    }

    if (entry.doa) {
      var doaEl = document.createElement("p");
      doaEl.className = "wish-item-doa";
      doaEl.textContent = entry.doa;
      item.appendChild(doaEl);
    }

    return item;
  }

  function getLocalEntries() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveLocalEntry(entry) {
    var entries = getLocalEntries();
    entries.push(entry);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(entries));
    } catch (e) {}
  }

  function renderWishes(jsonEntries) {
    if (!wishList) { return; }

    var loadingEl = document.getElementById("wishLoading");
    if (loadingEl) { loadingEl.remove(); }

    var localEntries = getLocalEntries();
    var all = (jsonEntries || []).concat(localEntries);

    // Sort newest first
    all.sort(function (a, b) {
      return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
    });

    wishList.innerHTML = "";

    if (all.length === 0) {
      var empty = document.createElement("p");
      empty.className = "wish-empty";
      empty.textContent = "Belum ada ucapan. Jadilah yang pertama!";
      wishList.appendChild(empty);
      return;
    }

    for (var i = 0; i < all.length; i += 1) {
      wishList.appendChild(renderWishItem(all[i]));
    }
  }

  function loadWishes() {
    if (!wishList) { return; }

    fetch("rsvp.json?_=" + Date.now())
      .then(function (res) {
        if (!res.ok) { throw new Error("failed"); }
        return res.json();
      })
      .then(function (data) {
        renderWishes(Array.isArray(data) ? data : []);
      })
      .catch(function () {
        renderWishes([]);
      });
  }

  // Apply guest name to cover
  var coverRecipient = document.getElementById("coverRecipient");
  if (coverRecipient) {
    coverRecipient.textContent = guestNameFromUrl || "Tamu yang Terhormat";
  }

  // Pre-fill or disable form
  var guestNameInput = document.getElementById("guestName");
  var formDisabledNotice = document.getElementById("formDisabledNotice");

  if (guestNameFromUrl) {
    if (guestNameInput) {
      guestNameInput.value = guestNameFromUrl;
      guestNameInput.setAttribute("readonly", "readonly");
    }
  } else {
    if (wishForm) {
      wishForm.style.display = "none";
    }
    if (formDisabledNotice) {
      formDisabledNotice.style.display = "";
    }
  }

  if (openBtn) {
    openBtn.addEventListener("click", openInvitation);
  }
  document.body.classList.remove("invitation-open");
  document.body.style.overflow = "hidden";

  if (musicToggle) {
    musicToggle.addEventListener("click", toggleMusic);
  }

  if (autoScrollToggle) {
    autoScrollToggle.addEventListener("click", toggleAutoScroll);
  }

  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("wheel", handlePagedWheel, { passive: false });
  window.addEventListener("touchstart", handlePagedTouchStart, { passive: true });
  window.addEventListener("touchend", handlePagedTouchEnd);
  window.addEventListener("keydown", handlePagedKeydown);
  window.addEventListener("load", revealOnScroll);
  window.addEventListener("load", updateScrollProgress);

  revealOnScroll();
  buildSectionPagerIds();
  initQuickNav();
  initGallerySlider();
  updateScrollProgress();
  setMusicButtonState(false);
  setAutoScrollButtonState(false);

  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  loadWishes();

  if (wishForm) {
    wishForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var nameInput = document.getElementById("guestName");
      var rsvpInput = document.querySelector('input[name="rsvp"]:checked');
      var ucapanInput = document.getElementById("guestUcapan");
      var doaInput = document.getElementById("guestDoa");

      var name = nameInput ? nameInput.value.trim() : "";
      var rsvp = rsvpInput ? rsvpInput.value : "";
      var ucapan = ucapanInput ? ucapanInput.value.trim() : "";
      var doa = doaInput ? doaInput.value.trim() : "";

      if (!name || !rsvp || !ucapan) {
        return;
      }

      var entry = {
        name: name,
        rsvp: rsvp,
        ucapan: ucapan,
        doa: doa,
        timestamp: new Date().toISOString()
      };

      saveLocalEntry(entry);

      // Re-fetch and re-render so new entry appears merged with JSON
      fetch("rsvp.json?_=" + Date.now())
        .then(function (res) { return res.ok ? res.json() : []; })
        .then(function (data) {
          renderWishes(Array.isArray(data) ? data : []);
        })
        .catch(function () {
          renderWishes([]);
        });

      if (ucapanInput) { ucapanInput.value = ""; }
      if (doaInput) { doaInput.value = ""; }
      var allRsvp = document.querySelectorAll('input[name="rsvp"]');
      for (var i = 0; i < allRsvp.length; i += 1) { allRsvp[i].checked = false; }
    });
  }
})();
