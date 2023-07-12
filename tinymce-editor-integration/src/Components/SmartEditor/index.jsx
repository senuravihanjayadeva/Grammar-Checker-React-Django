import React, { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";

export default function SmartEditor() {
  const editorRef = useRef(null);

  const handleEditorInit = (evt, editor) => {
    editorRef.current = editor;
  };

  const handleLogContent = () => {
    if (editorRef.current) {
      console.log(editorRef.current.getContent());
    }
  };

  function openPopup(grammarMistakes, editor, correctedText) {
    // Create the popup element
    let popup = document.createElement("div");
    popup.className = "popup-grammar-checker";

    grammarMistakes.forEach((mistakes) => {
      let divGrid = document.createElement("div");
      divGrid.className = "div-grid";
      mistakes.forEach((mistake) => {
        // Create the paragraphs
        var paragraph = document.createElement("p");
        paragraph.innerHTML = mistake;
        // Append the paragraphs to the popup element
        divGrid.appendChild(paragraph);
      });

      popup.appendChild(divGrid);
    });

    // Create the correction grammar button element
    let correctionButton = document.createElement("button");
    correctionButton.className = "grammar-correction-button";
    correctionButton.innerHTML = "Re-correct";
    correctionButton.onclick = function () {
      editor.selection.setContent(correctedText);
      popup.parentNode.removeChild(popup);
      return false;
    };

    // Create the close button element
    let closeButton = document.createElement("button");
    closeButton.className = "grammar-correction-close-button";
    closeButton.innerHTML = "Close";
    closeButton.onclick = function () {
      popup.parentNode.removeChild(popup);
      return false;
    };

    // Append the re correct button element to the popup
    popup.appendChild(correctionButton);
    // Append the close button element to the popup
    popup.appendChild(closeButton);
    // Append the popup element to the body
    document.body.appendChild(popup);

    // Close the popup when clicked outside
    document.addEventListener("click", function (event) {
      if (!popup.contains(event.target)) {
        popup.parentNode.removeChild(popup);
      }
    });
  }

  return (
    <>
      <Editor
        apiKey="your-api-key"
        onInit={handleEditorInit}
        initialValue="<p>This is the initial content of the editor.</p>"
        init={{
          height: 500,
          menubar: false,
          plugins: ["image"],
          toolbar: "image | GrammarChecker",
          setup: (editor) => {
            editor.ui.registry.addButton("GrammarChecker", {
              text: "Grammar Checker",
              icon: "highlight-bg-color",
              tooltip:
                "Highlight a prompt and click this button to query ChatGPT",
              enabled: true,
              onAction: async () => {
                const selection = editor.selection.getContent();
                console.log(selection);
                const data = {
                  text: selection,
                };
                const response = await fetch(
                  "http://127.0.0.1:8000/api/grammar-correction/",
                  {
                    method: "POST", // *GET, POST, PUT, DELETE, etc.
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data), // body data type must match "Content-Type" header
                  }
                );
                response.json().then((response) => {
                  console.log(response.corrected_text);
                  let correctedText = response.corrected_text;
                  let matches = response.matches;
                  let grammarMistakes = [];
                  for (let match of matches) {
                    let mistakes = [];

                    let incorrectText = match[4];
                    // Calculate the start and end positions for the span element
                    let start = match[3];
                    let end = match[3] + match[6];

                    // Rearrange the incorrectText with the span element
                    let rearrangedText =
                      incorrectText.substring(0, start) +
                      `<span class="incorrecttext">` +
                      incorrectText.substring(start, end) +
                      "</span>" +
                      incorrectText.substring(end);

                    mistakes.push(rearrangedText);
                    mistakes.push(`Error Type : ` + match[8]);
                    mistakes.push(`Suggestion : ` + match[1]);
                    mistakes.push(`<span class="suggestions">` + match[2].slice(0, 2) + "</span>");

                    grammarMistakes.push(mistakes);
                  }

                  openPopup(grammarMistakes, editor, correctedText);
                });
              },
            });
          },
        }}
      />
      <button onClick={handleLogContent}>Log editor content</button>
    </>
  );
}
