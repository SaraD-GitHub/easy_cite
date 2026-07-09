function buildSectionLink({ origin, pathname, styleguide, tabPaneId, dataBsTarget }) {
  const params = new URLSearchParams();
  if (styleguide) params.set('styleguide', styleguide);
  params.set('tab', tabPaneId.replace('sgt-', 'stn-'));
  params.set('accordion', dataBsTarget.replace(/^#/, ''));
  return `${origin}${pathname}?${params.toString()}`;
}

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', function () {
  //Add event listeners for the Bootstrap collapse
  const contextMenu = document.getElementById('context-menu');
  if (contextMenu) {
    contextMenu.addEventListener('show.bs.collapse', function () {
      document.body.style.overflow = 'hidden';
      contextMenu.style.maxHeight = '100vh';
    });

    contextMenu.addEventListener('hidden.bs.collapse', function () {
      document.body.style.overflow = '';
      contextMenu.style.maxHeight = '';
    });
  }

  // Function to check and redirect old URLs
  function redirectOldUrls() {
    const url = new URL(window.location.href);
    const hash = url.hash.substring(1); // Remove the '#' before processing

    if (hash.includes('#')) {
      const fragments = hash.split('#');
      const newParams = new URLSearchParams(url.search);

      fragments.forEach((fragment) => {
        if (fragment.startsWith('stn-')) {
          newParams.set('tab', fragment);
        } else if (fragment.startsWith('subtype-')) {
          newParams.set('accordion', fragment);
        }
      });

      // Construct new URL with the current origin
      const newUrl = `${url.origin}${url.pathname}?${newParams.toString()}`;

      // Redirect to the new URL
      window.location.replace(newUrl);
    }
  }

  // Execute the redirect function
  redirectOldUrls();

  // THEME SWITCHER
  const getStoredTheme = () => localStorage.getItem('theme');
  const setStoredTheme = (theme) => localStorage.setItem('theme', theme);

  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    return storedTheme ? storedTheme : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const setTheme = (theme) => {
    const themeToSet = theme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
    document.documentElement.setAttribute('data-bs-theme', themeToSet);
  };

  const showActiveTheme = (theme) => {
    document.querySelectorAll('.theme-switch').forEach((themeSwitcher) => {
      themeSwitcher.querySelectorAll('[data-bs-theme-value]').forEach((element) => {
        element.checked = element.getAttribute('data-bs-theme-value') === theme;
      });
    });
  };

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const storedTheme = getStoredTheme();
    if (storedTheme !== 'light' && storedTheme !== 'dark') {
      setTheme(getPreferredTheme());
    }
  });

  showActiveTheme(getPreferredTheme());
  document.querySelectorAll('.theme-switch [data-bs-theme-value]').forEach((toggle) => {
    toggle.addEventListener('change', () => {
      const theme = toggle.getAttribute('data-bs-theme-value');
      setStoredTheme(theme);
      setTheme(theme);
      showActiveTheme(theme);
    });
  });

  // Set the initial theme
  setTheme(getPreferredTheme());

  // Initialise URL parameters
  const params = new URLSearchParams(window.location.search);
  let styleguide = params.get('styleguide');
  let tabopen = params.get('tab') ? `#${params.get('tab')}` : '';
  let accordopen = params.get('accordion') ? `#${params.get('accordion')}` : '';
  // True only during the initial deep-link-to-a-section load, so the tab's
  // intro accordion doesn't auto-expand and shift the target out from under us.
  let deepLinkLanding = !!accordopen;
  // Once the user interacts, normal tab behaviour (intro auto-expand) resumes.
  ['pointerdown', 'keydown'].forEach((evt) =>
    window.addEventListener(evt, () => { deepLinkLanding = false; }, { once: true })
  );

  // Add click event listeners to "Next" and "Previous" navigation buttons
  document.querySelectorAll('.btn-nav-container button').forEach((button) => {
    button.addEventListener('click', function () {
      // Retrieve tab index from the data attribute
      const tabIndex = this.getAttribute('data-tab-index');

      // Locate the corresponding tab button using the tab index
      const tabButton = document.querySelector(`.nav-link[data-bs-target="#sgt-${tabIndex}"]`);

      // Simulate a click on the corresponding tab button if it exists
      if (tabButton) {
        tabButton.click();
      }
    });
  });

  // Function to check if an element is in view considering sticky header
  function isElementTopInViewport(el) {
    const rect = el.getBoundingClientRect();
    const offsetHeight = getOffsetHeight();
    return rect.top >= offsetHeight && rect.top < (window.innerHeight || document.documentElement.clientHeight);
  }

  // Smoothly scroll to the target if needed
  function scrollToPageContentIfNeeded(target) {
    const pageContent = document.getElementById('page-content');
    if (pageContent && !isElementTopInViewport(target)) {
      pageContent.scrollIntoView({
        behavior: 'instant',
      });
    }
  }

  // Helper function to calculate the total height of the header and submenu
  function getOffsetHeight() {
    const topNav = document.getElementById('top-navigation');
    const subMenu = document.getElementById('sub-menu');
    const topNavHeight = topNav ? topNav.offsetHeight : 0;
    const subMenuHeight = subMenu ? subMenu.offsetHeight : 0;
    return topNavHeight + subMenuHeight;
  }

  // Update tab and accordion from URL parameters
  function updateTabAndAccordionFromParams(setparam) {
    //console.log('Processing tab or accordion state from params');
    let target = document.querySelector(setparam);
    if (target) {
      if (setparam.includes('stn')) {
        const instance = new bootstrap.Tab(target);
        instance.show();
      } else if (setparam.includes('subtype')) {
        const accordionItem = target.closest('.accordion-item');
        accordionItem.querySelector('.accordion-collapse').classList.add('show');
        accordionItem.querySelector('.accordion-button').classList.remove('collapsed');
        accordionItem.querySelector('.accordion-button').setAttribute('aria-expanded', 'true');
        target = accordionItem;
      }
      if (params.get('accordion')) {
        setTimeout(() => {
          //console.log('Scrolling and focusing target');

          const topNavigation = document.querySelector('.top-navigation');
          const subMenu = document.getElementById('sub-menu');
          const topNavigationHeight = topNavigation ? topNavigation.offsetHeight : 0;
          let totalOffset = 0;

          // Check if sub-menu is hidden
          if (subMenu && window.getComputedStyle(subMenu).display !== 'none') {
            totalOffset = subMenu.offsetHeight;
          } else {
            totalOffset = topNavigationHeight;
          }

          window.scrollTo({
            top: target.getBoundingClientRect().top + window.scrollY - totalOffset,
          });

          // Optionally focus on the tab or accordion button
          requestAnimationFrame(() => {
            const focusableElement = target.querySelector('.accordion-button, .nav-link');
            if (focusableElement) {
              // Programmatic focus shouldn't paint a keyboard focus ring
              focusableElement.classList.add('js-no-focus-ring');
              focusableElement.focus({ preventScroll: true });
              focusableElement.addEventListener('blur', () => focusableElement.classList.remove('js-no-focus-ring'), { once: true });
            }
          });
        }, 500);
      }
    }
  }

  // Update query string and reload the page for style guide changes
  function updateQueryStringAndReload(event) {
    //console.log('Updating query string and reloading for style guide change');

    const button = event.target.closest('a[data-styleguide]');
    if (!button) return;

    event.preventDefault();

    const newStyleguide = button.getAttribute('data-styleguide');
    if (newStyleguide) {
      params.set('styleguide', newStyleguide);
      params.delete('tab');
      params.delete('accordion');

      window.history.pushState({}, '', `${location.pathname}?${params.toString()}`);
      location.href = location.href;
    }
  }

  // Update URL parameters for tabs and accordions
  function updateParams(fragment, type) {
    //console.log('Updating URL params');
    if (type === 'tab') {
      params.set('tab', fragment);
      params.delete('accordion'); // Clear accordion parameter when tab changes
    } else if (type === 'accordion') {
      params.set('accordion', fragment);

      // Update the tab parameter based on the currently active tab
      const activeTab = document.querySelector('.nav-link.active');
      if (activeTab) {
        const activeTabId = activeTab.getAttribute('id');
        params.set('tab', activeTabId);
      }
    }

    const orderedParams = new URLSearchParams();
    if (styleguide) orderedParams.set('styleguide', styleguide);
    if (params.get('tab')) orderedParams.set('tab', params.get('tab'));
    if (params.get('accordion')) orderedParams.set('accordion', params.get('accordion'));

    window.history.pushState({}, '', `${window.location.pathname}?${orderedParams.toString()}`);
  }

  // Add event listeners for navigation tab clicks
  const navTab = document.getElementById('nav-tab');
  if (navTab) {
    navTab.addEventListener('click', updateQueryStringAndReload);
  }

  // Add event listeners for home section menu clicks
  const homeSectionMenu = document.getElementById('home-section-menu');
  if (homeSectionMenu) {
    homeSectionMenu.addEventListener('click', updateQueryStringAndReload);
  }

  // Add event listeners for navigation tab clicks
  const menuTab = document.getElementById('context-menu');
  if (menuTab) {
    menuTab.addEventListener('click', updateQueryStringAndReload);
  }

  // Attach event listeners to tab navigation links
  document.querySelectorAll('.nav-link[data-bs-toggle="tab"]').forEach((button) => {
    button.addEventListener('click', function () {
      const setparam = this.getAttribute('id');
      updateParams(setparam, 'tab');
    });
  });

  // Attach event listeners to accordion buttons
  document.querySelectorAll('.accordion-button').forEach((button) => {
    button.addEventListener('click', function () {
      const setparam = this.getAttribute('data-bs-target').substring(1);
      updateParams(setparam, 'accordion');
    });
  });

  // Inject "copy link to this section" buttons into accordion headers
  const currentStyleguide = new URLSearchParams(window.location.search).get('styleguide');
  document.querySelectorAll('.accordion-button').forEach((toggle) => {
    const header = toggle.closest('.accordion-header');
    const tabPane = toggle.closest('.tab-pane');
    if (!header || !tabPane) return;

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-section-link';
    copyBtn.setAttribute('aria-label', 'Copy link to this section');
    copyBtn.innerHTML =
      '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" d="M8.51194 3.00541C9.18829 2.54594 10.0435 2.53694 10.6788 2.95419C10.8231 3.04893 10.9771 3.1993 11.389 3.61119C11.8009 4.02307 11.9513 4.17714 12.046 4.32141C12.4633 4.95675 12.4543 5.81192 11.9948 6.48827C11.8899 6.64264 11.7276 6.80811 11.3006 7.23511L10.6819 7.85383C10.4867 8.04909 10.4867 8.36567 10.6819 8.56093C10.8772 8.7562 11.1938 8.7562 11.389 8.56093L12.0077 7.94221L12.0507 7.89929C12.4203 7.52976 12.6568 7.2933 12.822 7.0502C13.4972 6.05623 13.5321 4.76252 12.8819 3.77248C12.7233 3.53102 12.4922 3.30001 12.1408 2.94871L12.0961 2.90408L12.0515 2.85942C11.7002 2.508 11.4692 2.27689 11.2277 2.11832C10.2377 1.46813 8.94398 1.50299 7.95001 2.17822C7.70691 2.34336 7.47044 2.57991 7.1009 2.94955L7.058 2.99247L6.43928 3.61119C6.24401 3.80645 6.24401 4.12303 6.43928 4.31829C6.63454 4.51355 6.95112 4.51355 7.14638 4.31829L7.7651 3.69957C8.1921 3.27257 8.35757 3.11027 8.51194 3.00541ZM4.31796 7.14672C4.51322 6.95146 4.51322 6.63487 4.31796 6.43961C4.12269 6.24435 3.80611 6.24435 3.61085 6.43961L2.99213 7.05833L2.94922 7.10124C2.57957 7.47077 2.34303 7.70724 2.17788 7.95035C1.50265 8.94432 1.4678 10.238 2.11799 11.2281C2.27656 11.4695 2.50766 11.7005 2.8591 12.0518L2.90374 12.0965L2.94837 12.1411C3.29967 12.4925 3.53068 12.7237 3.77214 12.8822C4.76219 13.5324 6.05589 13.4976 7.04986 12.8223C7.29296 12.6572 7.52943 12.4206 7.89896 12.051L7.94188 12.0081L8.5606 11.3894C8.75586 11.1941 8.75586 10.8775 8.5606 10.6823C8.36533 10.487 8.04875 10.487 7.85349 10.6823L7.23477 11.301C6.80777 11.728 6.6423 11.8903 6.48794 11.9951C5.81158 12.4546 4.95642 12.4636 4.32107 12.0464C4.17681 11.9516 4.02274 11.8012 3.61085 11.3894C3.19896 10.9775 3.0486 10.8234 2.95385 10.6791C2.53661 10.0438 2.54561 9.18863 3.00507 8.51227C3.10993 8.35791 3.27224 8.19244 3.69924 7.76544L4.31796 7.14672ZM9.62172 6.08558C9.81698 5.89032 9.81698 5.57373 9.62172 5.37847C9.42646 5.18321 9.10988 5.18321 8.91461 5.37847L5.37908 8.91401C5.18382 9.10927 5.18382 9.42585 5.37908 9.62111C5.57434 9.81637 5.89092 9.81637 6.08619 9.62111L9.62172 6.08558Z"/></svg>' +
      '<span class="copy-section-link__status" aria-live="polite"></span>';

    const status = copyBtn.querySelector('.copy-section-link__status');
    let revertTimer;
    copyBtn.addEventListener('click', function (event) {
      event.stopPropagation();
      const url = buildSectionLink({
        origin: window.location.origin,
        pathname: window.location.pathname,
        styleguide: currentStyleguide,
        tabPaneId: tabPane.id,
        dataBsTarget: toggle.getAttribute('data-bs-target'),
      });
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).catch(() => null);
      }
      copyBtn.classList.add('is-copied');
      status.textContent = 'Copied!';
      clearTimeout(revertTimer);
      revertTimer = setTimeout(() => {
        copyBtn.classList.remove('is-copied');
        status.textContent = '';
      }, 1200);
    });

    header.appendChild(copyBtn);
  });

  // Manage tab display and introduction accordion expansion
  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tab) => {
    tab.addEventListener('shown.bs.tab', function (event) {
      // Get the new tab's target content area
      const targetPane = document.querySelector(this.getAttribute('data-bs-target'));

      if (targetPane) {
        // Deep-linking to a specific section: don't auto-expand the intro or
        // steal scroll/focus — that shifts the target and lands us in the wrong spot.
        if (deepLinkLanding) return;
        scrollToPageContentIfNeeded(targetPane);

        // Focus on the tab pane content
        setTimeout(() => {
          targetPane.setAttribute('tabindex', '-1'); // Make it focusable temporarily
          targetPane.focus();
          targetPane.removeAttribute('tabindex'); // Remove the tabindex attribute if not needed
        }, 0);

        // Expand the first accordion item containing "introduction" (if needed)
        const accordionHeaders = targetPane.querySelectorAll('.accordion-button');
        let firstAccordionHeader = null;
        accordionHeaders.forEach((header, index) => {
          if (header.textContent.toLowerCase().startsWith('introduction')) {
            const accordionBody = header.closest('.accordion-item').querySelector('.accordion-collapse');
            if (!accordionBody.classList.contains('show')) {
              header.classList.remove('collapsed');
              header.setAttribute('aria-expanded', 'true');
              accordionBody.classList.add('show');
            }
            firstAccordionHeader = header;
          }
          // If no introduction, set to the first item in the accordion
          if (firstAccordionHeader === null && index === 0) {
            firstAccordionHeader = header;
          }
        });

        // Optionally focus on the accordion header if needed for your design
        // (Comment this out if you don't want to focus the accordion)

        if (firstAccordionHeader) {
          setTimeout(() => {
            if (document.activeElement !== firstAccordionHeader) {
              firstAccordionHeader.setAttribute('tabindex', '-1');
              firstAccordionHeader.focus();
              firstAccordionHeader.removeAttribute('tabindex');
            }
          }, 0);
        }
      }
    });
  });

  // Initialise tab and accordion state from URL parameters
  if (tabopen) updateTabAndAccordionFromParams(tabopen);
  if (accordopen) updateTabAndAccordionFromParams(accordopen);

  // Printing functionality for guides
  function printThisGuide(elem) {
    const thisButtonClass = elem.className;
    let printDiv;

    if (thisButtonClass.includes('sectionprint')) {
      printDiv = elem.closest('.accordion-item');
      if (!printDiv) {
        //console.error('Accordion section not found.');
        return;
      }
    } else if (thisButtonClass.includes('partprint')) {
      printDiv = elem.closest('.tab-pane');
      if (!printDiv) {
        //console.error('Tab pane not found.');
        return;
      }
    } else if (thisButtonClass.includes('guideprint')) {
      printDiv = document.getElementById('nav-tabContent');
      if (!printDiv) {
        //console.error('Printable guide not found.');
        return;
      }
    }

    if (printDiv) {
      const printTitle = document.querySelector('h1').textContent;
      const printContents = printDiv.innerHTML;

      const printWindow = window.open('', '', 'height=1200, width=800');
      if (printWindow) {
        printWindow.document.write('<html><head>');
        printWindow.document.write('<link href="assets/css/printstyles.css" rel="stylesheet">');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h1>RMIT Library: Easy Cite online referencing resource</h1>');
        printWindow.document.write('<h2>' + printTitle + ' Style Guide</h2>');
        printWindow.document.write('<div class="printsectionguide">' + printContents + '</div>');
        printWindow.document.close();

        setTimeout(() => {
          printWindow.print();
        }, 500);
      } else {
        //console.error('Failed to open print window.');
      }
    }
  }

  // Add event listeners for print buttons
  document.querySelectorAll('.btn-print').forEach((button) => {
    button.addEventListener('click', function () {
      printThisGuide(this);
    });
  });

  // Function to refresh the page when the state changes
  function handleStateChange() {
    // Check if the popstate event was triggered by "Skip to main content"
    if (window.skipToContentClicked) {
      //console.log('ignoring hash change');
      delete window.skipToContentClicked; // Remove the flag
      return; // Do nothing (don't reload)
    }
    //console.log('reloading the page');
    location.reload(); // Reload the page for other popstate events
  }

  // Listen for popstate event when using back/forward buttons
  window.addEventListener('popstate', handleStateChange);

  const skipLinks = document.querySelectorAll('a.skip-link');
  skipLinks.forEach((skipLink) => {
    skipLink.addEventListener('click', function (event) {
      event.preventDefault(); // Prevent the default jump behavior

      window.skipToContentClicked = true; // Set the flag (always set it)

      // Get the href target
      const targetSelector = skipLink.getAttribute('href');
      const targetElement = document.querySelector(targetSelector);

      if (targetElement) {
        // Scroll to the element, if required
        scrollToPageContentIfNeeded(targetElement);

        // Check if we should focus on a child element or the target itself
        if (skipLink.hasAttribute('data-focus-target')) {
          // Find the first visible and focusable element within the target
          const focusableElement = findFirstVisibleFocusableElement(targetElement);
          console.log(focusableElement);

          if (focusableElement) {
            // Focus on the visible, focusable element
            focusOnElement(focusableElement);
          } else {
            // If no visible focusable element, focus on the target itself.
            focusOnElement(targetElement);
          }
        } else {
          // If no data-focus-target, just focus on the target itself.
          focusOnElement(targetElement);
        }
      }
    });
  });


  function findFirstVisibleFocusableElement(container) {
    const focusableSelectors = 'a, button, [tabindex]:not([tabindex="-1"])';
    const focusableElements = container.querySelectorAll(focusableSelectors);

    for (const element of focusableElements) {
      if (isVisible(element)) {
        return element;
      }
    }

    return null;
  }

  function isVisible(element) {
    return element.offsetWidth > 0 && element.offsetHeight > 0 && getComputedStyle(element).visibility !== 'hidden';
  }

  function focusOnElement(element) {
    element.setAttribute('tabindex', '-1');
    element.focus();
    element.removeAttribute('tabindex');
  }
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildSectionLink };
}
