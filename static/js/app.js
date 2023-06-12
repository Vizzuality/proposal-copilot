import Alpine from "alpinejs";
import showdown from "showdown";
import TurndownService from "turndown";
import Quill from "quill";

// Markdown converter
const converter = new showdown.Converter();

let docAnalyzed = false;
let docDataAnalyzed = false;
const analysisIterations = 9;
const dataAnalysisIterations = 6;

// Spinning loader
const loader = {
  show: function () {
    Alpine.store("mainMenuStore").isLoading = true;
  },
  hide: function () {
    Alpine.store("mainMenuStore").isLoading = false;
  },
};

// Hide forms
const hideInterface = function () {
  Alpine.store("mainMenuStore").showInterface("");
};

// Proposal store
let monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
let date = new Date();
Alpine.store("proposalStore", {
  "proposal-title": "",
  "client-name": "",
  "project-name": "",
  "client-main-goal": "",
  "project-main-outcome": "",
  "goal-of-the-project": "",
  "type-of-information": "",
  "expected-time-in-weeks": "",
  proposalJson: "",
  month: monthNames[date.getMonth()],
  showForm: false,
  indexName: "",
  "proposal-uid": "",
  resetStore: function () {
    let container = document.getElementById("editor-content");
    let elements = container.querySelectorAll(".clonable-proposal-section");
    for (let i = 0; i < elements.length; i++) {
      elements[i].parentNode.removeChild(elements[i]);
    }

    for (let key in this) {
      if (typeof this[key] !== "function") {
        this[key] = "";
      }
    }
  },
  updateField(key, value) {
    this[key] = value;
  },
});

// Message store
Alpine.store("messageStore", {
  message: "",
  messageType: "",
  displayMessage: false,
  setMessage(message, type) {
    this.message = message;
    this.messageType = type;
    this.displayMessage = true;
    if (type === "info") {
      setTimeout(() => {
        this.displayMessage = false;
      }, 3000);
    }
  },
  closeMessage() {
    this.displayMessage = false;
  },
});

// Confirm store

Alpine.store("confirmStore", {
  isOpen: false,
  message: "",
  confirmHandler: null,

  open(message, confirmHandler) {
    this.message = message;
    this.confirmHandler = confirmHandler;
    this.isOpen = true;
  },

  close() {
    this.isOpen = false;
  },

  confirm() {
    if (this.confirmHandler) {
      this.confirmHandler();
    }
    this.close();
  },
});

// Main menu store
Alpine.store("mainMenuStore", {
  state: "initial",
  activeInterface: "",
  quillIsActive: false,
  isLoading: false,
  showInterface(interfaceName) {
    if (this.activeInterface !== interfaceName) {
      this.activeInterface = interfaceName;
      switch (interfaceName) {
        case "fileBrowser":
          this.state = "fileBrowserInterface";
          break;
        case "uploadForm":
          this.state = "uploadFormInterface";
          break;
        case "newSection":
          this.state = "newSection";
          break;
        case "interface2":
          this.state = "state2";
          break;
        case "destroyDoc":
          this.state = "destroyDocInterface";
          break;
        default:
          this.state = "initial";
      }
    }
  },
});

// Main menu functions
Alpine.data("mainMenuData", () => ({
  tempFormData: null,
  fileListHtml: "",
  destroyDocument() {
    Alpine.store("confirmStore").open(
      "Do you want to delete this document and all its data? This can't be undone.",
      function () {
        console.log("destroy doc");
        console.log(Alpine.store("proposalStore")["proposal-uid"]);
        let documentID = Alpine.store("proposalStore")["proposal-uid"];
        const url = "/documents/" + documentID;
        fetch(url, {
          method: "DELETE",
        })
          .then((response) => {
            if (!response.ok) {
              Alpine.store("messageStore").setMessage(
                "Sorry, there was an error and we couldn't delete the document. " +
                  response.status,
                "error"
              );
              throw new Error("HTTP error " + response.status);
            }
            return response.json();
          })
          .then((json) => {
            console.log(json.message);
            Alpine.store("proposalStore").resetStore();
            Alpine.store("messageStore").setMessage(
              "Document deleted.",
              "info"
            );
          })
          .catch(function () {
            Alpine.store("messageStore").setMessage(
              "Sorry, there was an error and we couldn't delete the document.",
              "error"
            );
          });
      }
    );
  },
  openFileBrowser() {
    const url = "/documents";
    return fetch(url, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        data.sort((a, b) => {
          const aName = a.name.replace(/[^\w]/g, "").toLowerCase();
          const bName = b.name.replace(/[^\w]/g, "").toLowerCase();
          return aName.localeCompare(bName);
        });

        let htmlString = "";

        for (let file of data) {
          htmlString += `
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <a class="text-sm cursor-pointer hover:text-blue-500 proposalLink" x-on:click.prevent="loadProposal('${file.id}')">${file.name}</a>
          </div>`;
        }

        // Update the innerHTML of the ref
        if (this.$refs.fileList) {
          this.$refs.fileList.innerHTML = htmlString;
        } else {
          // console.warn("fileList reference not found.");
        }
      })
      .catch((error) => {
        Alpine.store("messageStore").setMessage(
          "Sorry, I get the file list: " + data["error"],
          "error"
        );
      });
  },

  loadProposal(documentId) {
    hideInterface();
    loader.show();

    Alpine.store("proposalStore").resetStore();

    const url = `/documents/${encodeURIComponent(documentId)}`;
    return fetch(url, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);

        for (let key in data) {
          if (data.hasOwnProperty(key) && data[key]) {
            Alpine.store("proposalStore")[key] = data[key];
          }
        }
        let proposalJson = data["proposalJson"];
        if (proposalJson && Object.keys(proposalJson).length > 0) {
          for (let key in proposalJson) {
            if (proposalJson.hasOwnProperty(key) && proposalJson[key]) {
              let dataObject = {};
              dataObject[key] = proposalJson[key];
              parseResponseAndAppendToDOM(dataObject, true);
            }
          }
        }
        loader.hide();
        console.log("proposal uid doc");
        console.log(Alpine.store("proposalStore")["proposal-uid"]);

        Alpine.store("messageStore").setMessage("Proposal loaded", "info");
      });
  },

  saveProposalJson() {
    console.log("saving document");
    apiFunctionFactory.saveProposal();
  },
  createDoc() {
    console.log("creating doc");
    apiFunctionFactory
      .saveProposal()
      .then(() => {
        let proposalStoreJson = JSON.stringify(Alpine.store("proposalStore"));
        const url = "/create-doc";
        const data = proposalStoreJson;
        console.log(data);
        return fetch(url, {
          method: "POST",
          body: data,
        });
      })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          document.getElementById("upload-response").innerText = data["error"];
          Alpine.store("messageStore").setMessage(
            "Sorry, I couldn't create the doc: " + data["error"],
            "error"
          );
          throw new Error("Error creating the document."); // throw an error to stop execution
        } else {
          Alpine.store("messageStore").setMessage(
            `View your document: <a href="` +
              data["document_id"] +
              `" target="_blank"> Here </a>`,
            "success"
          );
          console.log("Post-save operations");
        }
      })
      .catch((error) => {
        // Catch any error
        Alpine.store("messageStore").setMessage(
          "Your session expired. Please, log out and log in again.",
          "error"
        );
        // Handle error here
      });
  },

  copyToClipboard() {
    var textToCopy = document.getElementById("editor-content").innerText;
    navigator.clipboard.writeText(textToCopy).then(
      function () {
        Alpine.store("messageStore").setMessage(
          "Text copied to the clipboard.",
          "info"
        );
      },
      function (err) {
        Alpine.store("messageStore").setMessage(
          "Could not copy text: " + err,
          "error"
        );
      }
    );
  },
  getGeneralData() {
    loader.show();
    if (Alpine.store("proposalStore").indexName === "") {
      Alpine.store("messageStore").setMessage(
        "Please, upload a document first.",
        "error"
      );
      loader.hide();
      return;
    }
    if (docDataAnalyzed == false) {
      for (let i = 0; i <= dataAnalysisIterations; i++) {
        setTimeout(() => {
          Alpine.store("messageStore").setMessage(
            "Analyzing document, this will take a moment.",
            "info"
          );

          this.tempFormData = new FormData();
          this.tempFormData.append("analysis-type", "general-data");
          this.tempFormData.append("iteration", i);

          apiFunctionFactory.analyzePDF(null, this.tempFormData);
          if (i == dataAnalysisIterations) {
            docDataAnalyzed = true;
          }
        }, 1000 * i); // wait i seconds before executing
      }
    } else {
      Alpine.store("messageStore").setMessage(
        "This document has already been analyzed.",
        "info"
      );
      loader.hide();
    }
  },
  analyzeDocument() {
    loader.show();
    if (Alpine.store("proposalStore").indexName === "") {
      Alpine.store("messageStore").setMessage(
        "Please, upload a document first.",
        "error"
      );
      loader.hide();
      return;
    }
    if (docAnalyzed == false) {
      for (let i = 0; i <= analysisIterations; i++) {
        setTimeout(() => {
          Alpine.store("messageStore").setMessage(
            "Analyzing document, this will take a moment.",
            "info"
          );

          this.tempFormData = new FormData();
          this.tempFormData.append("analysis-type", "initial-analysis");
          this.tempFormData.append("iteration", i);

          apiFunctionFactory.analyzePDF(null, this.tempFormData);
          if (i == analysisIterations) {
            docAnalyzed = true;
          }
        }, 1000 * i); // wait i seconds before executing
      }
    } else {
      Alpine.store("messageStore").setMessage(
        "This document has already been analyzed.",
        "info"
      );
      loader.hide();
    }
  },
  createEmpty() {
    loader.show();
    this.tempFormData = new FormData();
    this.tempFormData.append("analysis-type", "empty-section");
    apiFunctionFactory.createEmptySection(null, this.tempFormData);
    loader.hide();
  },

  newDocument() {
    Alpine.store("confirmStore").open(
      "Do you want to start from scratch? This can't be undone. All unsaved changes will be lost.",
      function () {
        Alpine.store("proposalStore").resetStore();
      }
    );
  },
}));

//Section menu interface
document.addEventListener("alpine:init", () => {
  Alpine.data("sectionMenu", () => ({
    quillIsActive: false,
    copyToClipboard(event) {
      event.preventDefault();
      const buttonData = getButtonData(event.target);
      let div = buttonData.containerDiv.querySelector(".prose");
      console.log(div);
      var textToCopy = div.innerText;
      navigator.clipboard.writeText(textToCopy).then(
        function () {
          Alpine.store("messageStore").setMessage(
            "Text copied to the clipboard.",
            "info"
          );
        },
        function (err) {
          Alpine.store("messageStore").setMessage(
            "Could not copy text: " + err,
            "error"
          );
        }
      );
    },
    elaborate(event) {
      event.preventDefault();
      const buttonData = getButtonData(event.target);
      const formData = new FormData();
      formData.append("section-prompt", buttonData.textContent);
      formData.append("section-title", buttonData.sectionName);
      formData.append("container-div", buttonData.containerDivId);
      formData.append("analysis-type", "elaborate");
      apiFunctionFactory.analyzePDF(null, formData);
    },
    similarity(event) {
      event.preventDefault();
      const buttonData = getButtonData(event.target);
      const formData = new FormData();
      formData.append("section-prompt", buttonData.textContent);
      formData.append("section-title", buttonData.sectionName);
      formData.append("container-div", buttonData.containerDivId);
      formData.append("analysis-type", "similarity");
      apiFunctionFactory.analyzePDF(null, formData);
    },
    askGPT(event) {
      event.preventDefault();
      const buttonData = getButtonData(event.target);
      const formData = new FormData();
      formData.append("section-prompt", buttonData.textContent);
      formData.append("section-title", buttonData.sectionName);
      formData.append("container-div", buttonData.containerDivId);
      formData.append("analysis-type", "askGPT");

      apiFunctionFactory.analyzePDF(null, formData);
    },
    solve(event) {
      event.preventDefault();
      const buttonData = getButtonData(event.target);
      const formData = new FormData();
      formData.append("section-prompt", buttonData.textContent);
      formData.append("section-title", buttonData.sectionName);
      formData.append("container-div", buttonData.containerDivId);
      formData.append("analysis-type", "solve");

      apiFunctionFactory.analyzePDF(null, formData);
    },
    remove(event) {
      event.preventDefault();
      Alpine.store("confirmStore").open(
        "Do you want to remove this section? This can't be undone.",
        function () {
          const buttonData = getButtonData(event.target);
          const el = document.getElementById(buttonData.containerDivId);
          el.remove();
        }
      );
    },
    edit(event) {
      event.preventDefault();
      const buttonData = getButtonData(event.target);
      const elId = buttonData.sectionName;
      const el = "section-div-" + elId;

      // Get the target div and its parent container
      const targetDiv = document.getElementById(el);
      const containerDiv = targetDiv.parentElement;

      var options = {
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, 4, false] }],
            ["bold", "italic", "underline"],
          ],
          keyboard: {
            bindings: {
              // bind shift+enter
              shiftEnter: {
                key: 13, // the key code for enter
                shiftKey: true, // require shift to be held down
                handler: function () {
                  // handle shift+enter here
                  const editor = document.querySelector(".ql-editor");
                  let html = editor.innerHTML;
                  quill.disable();
                  quill = null;

                  // Remove Quill classes
                  editor.classList.remove("ql-editor");
                  editor.parentNode.classList.remove("ql-container");
                  editor.parentNode.classList.remove("ql-bubble");
                  editor.parentNode.classList.remove("ql-disabled");

                  // Remove toolbar and tooltip elements
                  let tooltip = document.querySelector(".ql-tooltip");
                  let toolbar = document.querySelector(".ql-toolbar");
                  let clipboard = document.querySelector(".ql-clipboard");

                  // They are likely appended to body or some other common parent, not to the Quill container itself
                  tooltip.parentNode.removeChild(tooltip);
                  toolbar.parentNode.removeChild(toolbar);
                  clipboard.parentNode.removeChild(clipboard);

                  editor.parentNode.innerHTML = html;
                  Alpine.store("mainMenuStore").quillIsActive = false;
                  Alpine.store("messageStore").setMessage(
                    "Exited edit mode.",
                    "info"
                  );
                },
              },
            },
          },
        },
        debug: "error",
        theme: "bubble",
        bounds: containerDiv,
        scrollingContainer: targetDiv,
      };

      // Initialize Quill on the target div
      let quill = new Quill(targetDiv, options);
      Alpine.store("messageStore").setMessage("Entering edit mode.", "info");
      Alpine.store("mainMenuStore").quillIsActive = true;
    },
  }));
});

// Factory for API call functions
const apiFunctionFactory = {
  uploadFile: function (params) {
    const url = "/pdf-upload";
    const formData = new FormData();
    formData.append("file", params.file);

    return fetch(url, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          document.getElementById("upload-response").innerText = data["error"];
          Alpine.store("messageStore").setMessage(
            "Sorry, an error occurred: " + data["error"],
            "error"
          );
        } else {
          Alpine.store("proposalStore")["project-name"] = data["response"];
          Alpine.store("proposalStore").indexName = data["vector_index"];
          hideInterface();
        }
        loader.hide();
        return data;
      })
      .catch((error) => {
        Alpine.store("messageStore").setMessage(
          "Sorry, an error occurred: " + error,
          "error"
        );
      });
  },
  saveProposal: function () {
    console.log("saving proposal");
    const url = "/save-proposal";
    const data = proposalToJson();
    console.log(data);
    return fetch(url, {
      method: "POST",
      body: data,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          document.getElementById("upload-response").innerText = data["error"];
          Alpine.store("messageStore").setMessage(
            "Sorry, I couldn't save the proposal: " + data["error"],
            "error"
          );
          throw new Error("Error saving the proposal.");
        } else {
          console.log("saved proposal");
          console.log(data);
          Alpine.store("proposalStore")["proposal-uid"] = data.proposal_uid;
          Alpine.store("messageStore").setMessage(
            "Proposal " +
              Alpine.store("proposalStore")["project-name"] +
              " saved succesfully",
            "info"
          );
          console.log(
            "proposal-uid" + Alpine.store("proposalStore")["proposal-uid"]
          );
        }
      });
  },
  createEmptySection: function (formId = null, formData = null) {
    if (Alpine.store("proposalStore").indexName === "") {
      Alpine.store("messageStore").setMessage(
        "Please, upload a document first",
        "error"
      );
    }
    let data = {
      Empty: {
        question: "Empty section",
        response: "Edit this content",
      },
    };
    parseResponseAndAppendToDOM(data);
    loader.hide();
    Alpine.store("messageStore").setMessage("New section created", "info");
    return;
  },
  analyzePDF: function (formId = null, formData = null) {
    if (Alpine.store("proposalStore").indexName === "") {
      Alpine.store("messageStore").setMessage(
        "Please, upload a document first",
        "error"
      );
      loader.hide();
      return;
    }
    loader.show();
    if (formId && document.getElementById(formId)) {
      const form = document.getElementById(formId);
      formData = new FormData(form);
      formData.append("analysis-type", "new-section");
    } else if (!formData) {
      formData = new FormData(); // create a new empty FormData object if no formId and no formData provided
      console.log("I'm deleting your data");
    }
    formData.append("index-name", Alpine.store("proposalStore").indexName);
    let analysisType = formData.get("analysis-type");
    let url = "";
    let actionTitle = "";

    switch (analysisType) {
      case "initial-analysis":
        url = "/analyze-pdf";
        break;
      case "new-section":
        url = "/analyze-pdf";
        break;
      case "elaborate":
        url = "/analyze-pdf";
        actionTitle = "Elaborated text";
        break;
      case "similarity":
        url = "/similarity";
        actionTitle = "From previous proposals";
        break;
      case "askGPT":
        url = "/ask-gpt";
        actionTitle = "Reponse from GPT";
        break;
      case "general-data":
        url = "/analyze-pdf";
        break;
      case "solve":
        url = "/solve";
        actionTitle = "Solved using Tree of Thoughts";
        break;
      default:
        console.log("Invalid analysis type");
    }

    return fetch(url, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          document.getElementById("prompt-response").innerText = data["error"];
          Alpine.store("messageStore").setMessage(
            "Sorry, an error occurred: " + data["error"],
            "error"
          );
        } else {
          if (analysisType === "general-data") {
            parseGeneralDataAndAppendToDOM(data);
          } else if (
            analysisType === "initial-analysis" ||
            analysisType === "new-section"
          ) {
            parseResponseAndAppendToDOM(data);
          } else {
            data["container-div"] = formData.get("container-div");
            data["action-title"] = actionTitle;
            editContentInDOM(data);
          }
        }
        return data;
      })
      .catch((error) => {
        Alpine.store("messageStore").setMessage(
          "Sorry, an error occurred: " + error,
          "error"
        );
        console.error("Error:", error);
      });
  },
};

// Forms interface handlers
document.getElementById("upload-form").addEventListener("submit", function (e) {
  e.preventDefault();
});
// Dragover handler to set the drop effect.
document
  .getElementById("upload-form")
  .addEventListener("dragover", function (e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  });

// Drop handler to get the files.
document.getElementById("upload-form").addEventListener("drop", function (e) {
  e.preventDefault();
  e.stopPropagation();
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    apiFunctionFactory.uploadFile({ file: files[0] });
    loader.show();
  }
});

document.getElementById("file-upload").addEventListener("change", function (e) {
  e.preventDefault();
  const files = e.target.files;
  if (files.length > 0) {
    apiFunctionFactory.uploadFile({ file: files[0] });
    loader.show();
  }
});

document
  .getElementById("new-section")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    hideInterface();
    apiFunctionFactory.analyzePDF("new-section");
    document.getElementById("section-title").value = "";
    document.getElementById("section-prompt").value = "";
    Alpine.store("messageStore").setMessage("Sending to AI.", "info");
  });

// Function to get data for the event initiator
function getButtonData(button) {
  const containerDiv = button.closest('div[id^="section-container-"]');
  const containerDivId = containerDiv.id;
  if (!containerDiv) {
    Alpine.store("messageStore").setMessage(
      "Sorry, an error occurred: missing container",
      "error"
    );
    return null;
  }
  const sectionName = containerDiv.id.slice("section-container-".length);
  const textContent = containerDiv.innerText;

  return { sectionName, textContent, containerDivId, containerDiv };
}

// Response paresers
function parseGeneralDataAndAppendToDOM(data) {
  console.log(data);
  for (const key in data) {
    if (data.hasOwnProperty(key) && data[key].hasOwnProperty("response")) {
      Alpine.store("proposalStore")[key] = data[key]["response"];
    }
    loader.hide();
  }
}

function parseResponseAndAppendToDOM(data, fromRecovery = false) {
  let current_date = new Date();
  let time_string =
    current_date.getHours() +
    "-" +
    current_date.getMinutes() +
    "-" +
    current_date.getSeconds() +
    "-" +
    current_date.getMilliseconds();
  const editorContent = document.getElementById("editor-content");
  for (const key in data) {
    const sectionContainer = document
      .getElementById("proposal-section-container")
      .cloneNode(true);
    sectionContainer.removeAttribute("id");
    sectionContainer.id =
      "section-container-" + key.replace(/ /g, "-") + "-" + time_string;

    const sectionDiv = sectionContainer.querySelector("#proposal-section");

    sectionDiv.removeAttribute("id");
    sectionDiv.id = "section-div-" + key.replace(/ /g, "-") + "-" + time_string;

    const h3 = document.createElement("h3");
    h3.textContent = key;

    const markdownText = data[key]["response"];
    const htmlText = converter.makeHtml(markdownText);

    if (fromRecovery === true) {
      sectionDiv.innerHTML = htmlText;
    } else {
      sectionDiv.innerHTML = h3.outerHTML + htmlText;
    }

    editorContent.appendChild(sectionContainer);
  }
  Alpine.store("messageStore").setMessage("New section created", "info");
  loader.hide();
}

function editContentInDOM(data) {
  const sectionContainerId = data["container-div"];
  const sectionDivId = sectionContainerId.replace(
    "section-container-",
    "section-div-"
  );

  const sectionDiv = document.getElementById(sectionDivId);

  const h4 = document.createElement("h4");
  h4.textContent = data["action-title"];
  sectionDiv.appendChild(h4);

  for (const key in data) {
    if (key !== "container-div") {
      if (
        typeof data[key] === "object" &&
        data[key].hasOwnProperty("response")
      ) {
        const markdownText = data[key]["response"];
        const htmlText = converter.makeHtml(markdownText);

        // Create a temporary div to hold the HTML
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlText;

        // Append all elements from the temporary div to the sectionDiv
        while (tempDiv.firstChild) {
          if (tempDiv.firstChild) {
            sectionDiv.appendChild(tempDiv.firstChild);
          }
        }
      }
    }
  }
  Alpine.store("messageStore").setMessage(
    "New info added to " + data["action-title"],
    "info"
  );
  loader.hide();
}

function proposalToJson() {
  let editorContentDivs = document.querySelectorAll("#editor-content .prose");
  let proposalJson = {};
  let turndownService = new TurndownService();
  editorContentDivs.forEach((div) => {
    let key = div.id
      .replace("section-div-", "")
      .replace(/-\d{2}-\d{2}-\d{2}-\d{3}$/, "")
      .replace(/-/g, " ");
    let markdownResponse = turndownService.turndown(div);
    proposalJson[key] = {
      question: "none",
      response: markdownResponse,
    };
  });
  console.log(proposalJson);
  Alpine.store("proposalStore").proposalJson = proposalJson;
  let proposalStore = Alpine.store("proposalStore");
  let proposalStoreJson = JSON.stringify(proposalStore);
  return proposalStoreJson;
}

// Start alpine
Alpine.start();
