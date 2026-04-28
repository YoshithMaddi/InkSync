import { useEffect } from "react";
import { getTextBounds, overlayPosition } from "./canvas";
import { TextEditor, TextToolbar, TextToolbarButton, TextToolbarLabel } from "./styles";

function toolbarPosition(textItem, camera, viewport) {
  const bounds = getTextBounds(textItem);
  return overlayPosition(
    {
      x: bounds.left + bounds.width / 2,
      y: bounds.top
    },
    camera,
    viewport
  );
}

function TextEditorOverlay({
  camera,
  editingText,
  isLockedByCurrentUser,
  selectedText,
  textInputRef,
  viewport,
  onBlur,
  onInput,
  onKeyDown,
  onToggleBold,
  onFontSizeChange
}) {
  useEffect(() => {
    if (!editingText || !textInputRef.current) {
      return;
    }

    const focusEditor = () => {
      const editor = textInputRef.current;
      if (!editor) {
        return;
      }

      editor.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    };

    const frameId = window.requestAnimationFrame(() => {
      focusEditor();
      window.setTimeout(focusEditor, 0);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [editingText, textInputRef]);

  return (
    <>
      {selectedText ? (
        <TextToolbar style={toolbarPosition(selectedText, camera, viewport)}>
          <TextToolbarLabel>Text</TextToolbarLabel>
          <TextToolbarButton type="button" onClick={() => onFontSizeChange(-2)}>
            A-
          </TextToolbarButton>
          <TextToolbarButton type="button" onClick={() => onFontSizeChange(2)}>
            A+
          </TextToolbarButton>
          <TextToolbarButton
            type="button"
            $active={String(selectedText.fontWeight || 400) !== "400"}
            onClick={onToggleBold}
          >
            B
          </TextToolbarButton>
        </TextToolbar>
      ) : null}

      {editingText ? (
        <TextEditor
          ref={textInputRef}
          contentEditable={isLockedByCurrentUser}
          suppressContentEditableWarning
          spellCheck={false}
          data-placeholder="Type text"
          style={{
            ...overlayPosition(editingText, camera, viewport),
            fontSize: `${editingText.size || 28}px`,
            fontWeight: editingText.fontWeight || 400,
            color: editingText.color
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onInput={onInput}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        >
          {editingText.text}
        </TextEditor>
      ) : null}
    </>
  );
}

export default TextEditorOverlay;
