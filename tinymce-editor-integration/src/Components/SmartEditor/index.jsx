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

  function openPopup(rearrangedTextArray) {
    // Create the popup element
    var popup = document.createElement("div");
    popup.style.position = "absolute";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.width = "500px";
    popup.style.height = "700px";
    popup.style.backgroundColor = "#fff";
    popup.style.border = "1px solid #ccc";
    popup.style.padding = "10px";
    popup.style.zIndex = "9999";
    popup.style.overflow = "auto"; // Enable scrolling for overflowed content

    rearrangedTextArray.forEach((element) => {
      if (element === "End") {
        var hrElement = document.createElement("hr");
        // Append the hr to the popup element
        popup.appendChild(hrElement);
      } else {
        // Create the paragraphs
        var paragraph = document.createElement("p");
        paragraph.innerHTML = element;
        // Append the paragraphs to the popup element
        popup.appendChild(paragraph);
      }
    });

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
                  let matches = response.matches;
                  let rearrangedTextArray = [];
                  for (let match of matches) {
                    let incorrectText = match[4];
                    // Calculate the start and end positions for the span element
                    let start = match[5];
                    let end = match[5] + match[6];

                    // Rearrange the incorrectText with the span element
                    let rearrangedText =
                      incorrectText.substring(0, start) +
                      `<span class="incorrecttext">` +
                      incorrectText.substring(start, end) +
                      "</span>" +
                      incorrectText.substring(end);

                    rearrangedTextArray.push(rearrangedText);
                    rearrangedTextArray.push(match[8]);
                    rearrangedTextArray.push(match[1]);
                    rearrangedTextArray.push("End");
                  }

                  editor.selection.setContent(response.corrected_text);

                  openPopup(rearrangedTextArray);
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
