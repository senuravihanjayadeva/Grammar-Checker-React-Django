import React, { useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import ReactLoading from "react-loading";

export default function SmartEditor() {
  const editorRef = useRef(null);
  const [grammerChecker, setGrammerChecker] = useState(false);

  const handleEditorInit = (evt, editor) => {
    editorRef.current = editor;
  };

  const handleLogContent = () => {
    if (editorRef.current) {
      console.log(editorRef.current.getContent());
    }
  };

  function openPopupGrammarChecker(
    grammarMistakes,
    editor,
    correctedText,
    count
  ) {
    // Create the popup element
    let popup = document.createElement("div");
    popup.id = "popup-grammar-checker-panel";
    popup.className = "popup-grammar-checker";

    // Create the header for count
    let countText = document.createElement("h3");
    countText.className = "popup-grammar-checker-header";
    if (count > 0) {
      countText.innerHTML = `${count} mistakes found`;
    } else {
      countText.innerHTML = `No mistakes found`;
    }
    // Append the paragraphs to the popup element
    popup.appendChild(countText);

    grammarMistakes.forEach((mistakes) => {
      let divGrid = document.createElement("div");
      divGrid.className = "div-grid";
      mistakes.forEach((mistake) => {
        // Create the paragraphs
        let paragraph = document.createElement("p");
        paragraph.innerHTML = mistake;
        // Append the paragraphs to the popup element
        divGrid.appendChild(paragraph);
      });

      popup.appendChild(divGrid);
    });

    if (count > 0) {
      // Create the correction grammar button element
      let correctionButton = document.createElement("button");
      correctionButton.className = "grammar-correction-button";
      correctionButton.innerHTML = "Re-correct";
      correctionButton.onclick = function () {
        editor.selection.setContent(correctedText);
        popup.remove();
        return false;
      };

      // Append the re correct button element to the popup
      popup.appendChild(correctionButton);
    }

    // Create the close button element
    let closeButton = document.createElement("button");
    closeButton.className = "grammar-correction-close-button";
    closeButton.innerHTML = "Close";
    closeButton.onclick = function () {
      popup.remove();
      return false;
    };
    // Append the close button element to the popup
    popup.appendChild(closeButton);
    // Append the popup element to the body
    document.body.appendChild(popup);

    // Close the popup when clicked outside
    document.addEventListener("click", function (event) {
      if (!popup.contains(event.target) && popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
    });
  }

  return (
    <>
      {grammerChecker ? (
        <ReactLoading
          type={"spin"}
          color="#0A99E5"
          height={100}
          width={100}
          className="ReactLoading"
        />
      ) : (
        <></>
      )}
      <Editor
        apiKey="your-api-key"
        onInit={handleEditorInit}
        initialValue="<p>This is the initial content of the editor.</p>"
        init={{
          height: 500,
          menubar: true,
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
                setGrammerChecker(true);
                const selection = editor.selection.getContent();
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
                  setGrammerChecker(false);
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
                    mistakes.push(`<b>Error : </b> ` + match[8]);
                    mistakes.push(`<b>${match[1]}</b> `);
                    mistakes.push(
                      `<b>Suggestions : </b> <span class="suggestions">` +
                        match[2].slice(0, 2) +
                        "</span>"
                    );

                    grammarMistakes.push(mistakes);
                  }

                  openPopupGrammarChecker(
                    grammarMistakes,
                    editor,
                    correctedText,
                    matches.length
                  );
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
