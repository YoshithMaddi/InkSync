function ToolIcon({ kind }) {
  if (kind === "pen") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 20l4.5-1 9-9-3.5-3.5-9 9L4 20zM12.8 5.3l3.5 3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "eraser") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M8 16l6.8-6.8a2 2 0 012.8 0l1.2 1.2a2 2 0 010 2.8L14 18H9.8L8 16zm-2.6-2.6l6.2-6.2a2 2 0 012.8 0l1.2 1.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M14 18h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "text") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 6h12M12 6v12M9 18h6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "hand") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M8 12V7a1 1 0 112 0v4m0 1V6a1 1 0 112 0v6m0-1V7.5a1 1 0 112 0V12m-6 0V8.5a1 1 0 00-2 0V15a4 4 0 004 4h2.4a4 4 0 003.5-2l1.2-2.2A2.5 2.5 0 0017 11h-1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "thickness") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="8" cy="12" r="2" fill="currentColor" />
        <circle cx="16" cy="12" r="4" fill="currentColor" />
      </svg>
    );
  }

  if (kind === "clear") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 7h12M9 7V5h6v2M8 7l1 12h6l1-12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "reset") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 12a8 8 0 108-8 8.2 8.2 0 00-5.7 2.3M4 5v4h4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "undo") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M9 7L5 11l4 4M6 11h7a5 5 0 010 10h-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "redo") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M15 7l4 4-4 4M18 11h-7a5 5 0 000 10h2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="currentColor" />
    </svg>
  );
}

export default ToolIcon;
