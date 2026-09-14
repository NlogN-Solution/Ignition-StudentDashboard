import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * The several ways into one thing, without ever leaving the thing.
 *
 * A port of the public platform's `components/ui/DetailTabs.tsx`, kept
 * deliberately close to it. A student researches on the public site and then
 * applies here; if a course reads as one shape out there and a different one
 * in the portal, the portal looks like a lesser copy of the marketing site
 * rather than the place the work actually happens.
 *
 * Two differences from the original, both forced by the setting:
 *
 * * **Panels are functions, not elements.** The public site renders all of
 *   them on the server so every tab is in the HTML for search engines. Nothing
 *   crawls the portal, and rendering six panels' worth of a 4,800-row
 *   catalogue on every open would be work nobody asked for, so a panel is
 *   built when it is first shown and then kept mounted.
 * * **The hash is not written.** The portal is a `BrowserRouter` app behind a
 *   login; a hash here would survive into links a student cannot share
 *   usefully anyway. The open tab is component state.
 */
const DetailTabs = ({ tabs, label }) => {
  const [active, setActive] = useState(tabs[0]?.id);
  // Once a tab has been opened it stays mounted, so switching back is instant
  // and any scroll position inside it survives.
  const [seen, setSeen] = useState(() => new Set([tabs[0]?.id]));
  const listRef = useRef(null);

  const select = useCallback((id) => {
    setActive(id);
    setSeen((current) => new Set(current).add(id));
  }, []);

  // A tab set can change under us — the university detail hides its Courses
  // tab until the offerings arrive. If the open tab goes away, fall back to
  // the first rather than rendering nothing.
  useEffect(() => {
    if (!tabs.some((tab) => tab.id === active) && tabs.length) select(tabs[0].id);
  }, [tabs, active, select]);

  const onKeyDown = (event) => {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();

    const index = tabs.findIndex((tab) => tab.id === active);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
        ? tabs.length - 1
        : event.key === "ArrowLeft"
        ? (index - 1 + tabs.length) % tabs.length
        : (index + 1) % tabs.length;

    select(tabs[next].id);
    listRef.current?.querySelectorAll("[role='tab']")[next]?.focus();
  };

  const openTab = tabs.find((tab) => tab.id === active) ?? tabs[0];
  if (!openTab) return null;

  return (
    <>
      {/* Sticky under the app header (h-16), so a student six screens into the
          fees table can switch to requirements without scrolling back up. */}
      <div className="sticky top-16 z-20 -mx-4 border-b border-hairline bg-canvas/95 px-4 backdrop-blur-md lg:-mx-6 lg:px-6">
        <div className="flex items-center gap-6 py-3">
          <div
            ref={listRef}
            role="tablist"
            aria-label={label}
            onKeyDown={onKeyDown}
            /* Scrolls horizontally on narrow screens rather than wrapping to
               two rows, which would push the content down on every phone. */
            className="flex min-w-0 flex-1 snap-x gap-1 overflow-x-auto rounded-xl border border-hairline bg-white p-1 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map((tab) => {
              const selected = tab.id === openTab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(tab.id)}
                  className={`inline-flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    selected
                      ? "bg-navy-900 text-white shadow-sm"
                      : "text-ink-muted hover:bg-canvas hover:text-navy-900"
                  }`}
                >
                  <span aria-hidden className={selected ? "text-white" : "text-ink-faint"}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* One hint, for the tab that is open. Six hints under six tabs made
              the bar two lines tall and asked the student to read the five
              answers they had not chosen. */}
          {openTab.hint && (
            <p className="hidden shrink-0 text-xs font-medium text-ink-faint xl:block">
              {openTab.hint}
            </p>
          )}
        </div>
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== openTab.id}
          tabIndex={0}
          className="focus:outline-none"
        >
          {seen.has(tab.id) ? tab.panel() : null}
        </div>
      ))}
    </>
  );
};

export default DetailTabs;
