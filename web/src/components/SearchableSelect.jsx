import { useEffect, useMemo, useRef, useState } from 'react';

export default function SearchableSelect({
  label,
  value,
  onChange,
  options,
  allOption = { value: '', label: 'All' },
  searchPlaceholder = 'Search…',
  emptyMessage = 'No matches',
  minWidth = '10rem',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  const selected =
    options.find((option) => option.value === value) ??
    (value ? { value, label: value } : allOption);

  const summary = value ? selected.label : allOption.label;

  const filteredOptions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;

    searchRef.current?.focus();

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  function choose(nextValue) {
    onChange(nextValue);
    setOpen(false);
    setQuery('');
  }

  return (
    <div
      ref={rootRef}
      className={`header-filter searchable-select${open ? ' is-open' : ''}`}
      style={{ '--select-min-width': minWidth }}
    >
      <span className="header-filter-label">{label}</span>
      <button
        type="button"
        className="header-filter-trigger searchable-select-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="searchable-select-value">{summary}</span>
        <span className="header-filter-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div className="header-filter-menu panel searchable-select-menu" role="listbox">
          <input
            ref={searchRef}
            type="search"
            className="searchable-select-search"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={`${label} search`}
          />
          <div className="searchable-select-list">
            <button
              type="button"
              role="option"
              aria-selected={!value}
              className={`searchable-select-option${!value ? ' is-selected' : ''}`}
              onClick={() => choose('')}
            >
              {allOption.label}
            </button>
            {filteredOptions.length === 0 ? (
              <p className="searchable-select-empty">{emptyMessage}</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={`searchable-select-option${option.value === value ? ' is-selected' : ''}`}
                  onClick={() => choose(option.value)}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
