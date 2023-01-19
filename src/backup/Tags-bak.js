// https://github.com/k-ivan/Tags
(function () {
  // Helpers
  const $$ = (selectors, context) => {
    return typeof selectors === "string"
      ? (context || document).querySelectorAll(selectors)
      : [selectors];
  };

  const $ = (selector, context) => {
    return typeof selector === "string"
      ? (context || document).querySelector(selector)
      : selector;
  };

  const create = (tag, attr) => {
    const element = document.createElement(tag);
    if (attr) {
      for (const name in attr) {
        if (element[name] !== undefined) {
          element[name] = attr[name];
        }
      }
    }
    return element;
  };

  const whichTransitionEnd = () => {
    const root = document.documentElement;
    const transitions = {
      transition: "transitionend",
      WebkitTransition: "webkitTransitionEnd",
      MozTransition: "mozTransitionEnd",
      OTransition: "oTransitionEnd otransitionend"
    };

    for (const t in transitions) {
      if (root.style[t] !== undefined) {
        return transitions[t];
      }
    }
    return false;
  };

  const oneListener = (el, type, fn, capture) => {
    capture = capture || false;
    el.addEventListener(
      type,
      function handler(e) {
        fn.call(this, e);
        el.removeEventListener(e.type, handler, capture);
      },
      capture
    );
  };

  const hasClass = (cls, el) => {
    return new RegExp("(^|\\s+)" + cls + "(\\s+|$)").test(el.className);
  };

  const addClass = (cls, el) => {
    if (!hasClass(cls, el))
      return (el.className += el.className === "" ? cls : " " + cls);
  };

  const removeClass = (cls, el) => {
    el.className = el.className.replace(
      new RegExp("(^|\\s+)" + cls + "(\\s+|$)"),
      ""
    );
  };

  const toggleClass = (cls, el) => {
    !hasClass(cls, el) ? addClass(cls, el) : removeClass(cls, el);
  };

  const Tags = (tag) => {
    const el = $(tag);

    if (el.instance) return;
    el.instance = this;

    // Save input type
    let type = el.type;

    const transitionEnd = whichTransitionEnd();
    let tagsArray = [];
    let tagsExpression = "";
    const KEYS = {
      ENTER: 13,
      // COMMA: 188,
      BACK: 8
    };

    let isPressed = false;

    let timer = {};
    let wrap = {};
    let expr = {};
    let preview = {};
    let previewpara = {};
    let field = {};
    let button = {};
    let entry = {};
    let dropdown = {};
    let dropdownContent = {};
    let dropdownHead = {};
    let currentTagType = "function";

    const init = () => {
      // create and add wrapper
      wrap = create("div", {
        className: "tags-container"
      });

      expr = create("div", {
        className: "tags-expression"
      });

      preview = create("div", {
        className: "tags-preview"
      });

      previewpara = create("p", {
        textContent: ""
      });

      entry = create("div", {
        className: "tags-entry"
      });

      dropdown = create("div", {
        className: "tags-dropdown"
      });

      dropdownHead = create("div", {
        className: "tags-dropdown_head"
      });

      dropdownContent = create("div", {
        className: "tags-dropdown_content"
      });

      button = create("button", {
        type: "button",
        textContent: "Save",
        className: "tag-save"
      });

      field = create("input", {
        type: "text",
        className: "tag-input",
        placeholder: el.placeholder || ""
      });

      dropdown.appendChild(dropdownHead);
      dropdown.appendChild(dropdownContent);
      entry.appendChild(field);
      entry.appendChild(dropdown);
      wrap.appendChild(button);
      wrap.appendChild(entry);

      if (el.value.trim() !== "") {
        hasTags();
      }

      preview.appendChild(previewpara);

      el.type = "hidden";
      el.parentNode.insertBefore(wrap, el.nextSibling);
      el.parentNode.insertBefore(expr, el.nextSibling);
      el.parentNode.insertBefore(preview, el.nextSibling);

      wrap.addEventListener("click", onTagsInputHandler, false);
      wrap.addEventListener("keydown", keyHandler, false);
      wrap.addEventListener("keyup", backHandler, false);
      wrap.addEventListener("click", dropdownClickHandler, false);
      expr.addEventListener("click", onExprClickHandler, false);
      document.addEventListener("click", onDocumentHandler, false);

      setSuggestionDropdown(data);
    };

    const onExprClickHandler = (e) => {
      // const clickedElement = e.target.className;
    };

    const onDocumentHandler = (e) => {
      const clickedElement = e.target.className;
      if (!clickedElement) {
        removeClass("open", $(dropdown));
        // dropdown.classList.remove("open");
      }
      // console.log("clickedElement", clickedElement);
    };

    const dropdownClickHandler = (e) => {
      const clickElement = e.target;
      // console.log("clickElement", clickElement);
      if (clickElement.className.includes("tags-dropdown--item")) {
        const val = clickElement.dataset.value;
        // console.log("-----", clickElement.dataset.value);
        const tag = createTag(val);
        wrap.insertBefore(tag, entry);
        tagsArray.push(val);
        if (currentTagType === "function") {
          const operator = createTag("(");
          wrap.insertBefore(operator, entry);
          tagsArray.push("(");
        }
        updateExpression();
        currentTagType =
          currentTagType === "function" ? "operator" : "function";
        setActiveDropdown(currentTagType);
        dropdown.classList.add("open");
        // suggestionItemTemplate(data, currentTagType);
      }

      const tagTypes = [...new Set(data.map((item) => item.type))];

      tagTypes.forEach((item, index) => {
        const elemClass = clickElement.className.includes(
          `tags-dropdown_head--${item}`
        );

        if (elemClass) {
          setActiveDropdown(item);
        }
      });
    };

    const setActiveDropdown = (tab) => {
      resetDropdownTabs(tab);
      resetContentTabs(tab);
      addClass("active", $(`.tags-dropdown_head--${tab}`));
      addClass("active", $(`.tags-dropdown_content-${tab}`));
    };

    const hasTags = () => {
      let arr = el.value.trim().split(",");
      arr.forEach(function (item) {
        item = item.trim();
        if (~tagsArray.indexOf(item)) {
          return;
        }
        const tag = createTag(item);
        tagsArray.push(item);
        wrap.insertBefore(tag, entry);
        updateExpression();
      });
    };

    const createTag = (name) => {
      const tag = create("div", {
        className: "tag",
        innerHTML:
          '<span class="tag__name">' +
          name +
          "</span>" +
          '<button class="tag__remove">&times;</button>'
      });
      return tag;
    };

    const data = [
      {
        name: "If",
        signature: "If(condition, truePart, falsePart)",
        type: "function",
        category: "Global",
        value: "If",
        tooltip:
          "Evaluates a condition and returns either the second parameter or the third parameter, depending on the outcome of the condition (same as the Visual Basic `If` function)"
      },
      {
        name: "Concat",
        type: "function",
        category: "Global",
        value: "Concat",
        tooltip:
          "Concat concatenates one or more strings. Example: `Concat('a', 'b', 'c')`"
      },
      {
        name: "Lower",
        signature: "Lower(string)",
        type: "function",
        category: "Global",
        value: "Lower",
        tooltip:
          "`Lower(string)` converts the value of a specified string to its lowercase equivalent."
      },
      {
        name: "Upper",
        signature: "Upper(string)",
        type: "function",
        category: "Global",
        value: "Upper",
        tooltip:
          "`Upper(string)` converts the value of a specified string to its uppercase equivalent."
      },
      {
        name: "Today",
        signature: "Today()",
        type: "function",
        category: "Global",
        value: "Today()",
        tooltip: "Current date"
      },
      {
        name: "Now",
        signature: "Now()",
        type: "function",
        category: "Global",
        value: "Now()",
        tooltip: "Current date and time"
      },
      {
        name: "Date",
        signature: "Date(year, month, day)",
        type: "function",
        category: "Global",
        value: "Date",
        tooltip: "Date from **year**, **month** and **day**"
      },
      {
        name: "Year",
        signature: "Year",
        type: "function",
        category: "Global",
        value: "Year",
        tooltip: ""
      },
      {
        name: "Month",
        signature: "Month",
        type: "function",
        category: "Global",
        value: "Month",
        tooltip: ""
      },
      {
        name: "Day",
        signature: "Day",
        type: "function",
        category: "Global",
        value: "Day",
        tooltip: ""
      },
      {
        name: "Hour",
        signature: "Hour",
        type: "function",
        category: "Global",
        value: "Hour",
        tooltip: ""
      },
      {
        name: "Minute",
        signature: "Minute",
        type: "function",
        category: "Global",
        value: "Minute",
        tooltip: ""
      },
      {
        name: "Second",
        signature: "Second",
        type: "function",
        category: "Global",
        value: "Second",
        tooltip: ""
      },
      {
        name: "AmountDC",
        signature: "",
        type: "property",
        category: "Sales order",
        value: "AmountDC",
        tooltip: "Amount in default currency"
      },
      { name: "(", type: "operator", value: "(", tooltip: "" },
      { name: ")", type: "operator", value: ")", tooltip: "" },
      { name: "+", type: "operator", value: "+", tooltip: "" },
      { name: "-", type: "operator", value: "-", tooltip: "" },
      { name: "*", type: "operator", value: "*", tooltip: "" },
      { name: "/", type: "operator", value: "/", tooltip: "" },
      { name: "=", type: "operator", value: "=", tooltip: "" },
      { name: "!=", type: "operator", value: "!=", tooltip: "" },
      { name: "<>", type: "operator", value: "<>", tooltip: "" },
      { name: ">", type: "operator", value: ">", tooltip: "" },
      { name: ">=", type: "operator", value: ">=", tooltip: "" },
      { name: "<", type: "operator", value: "<", tooltip: "" },
      { name: "<=", type: "operator", value: "<=", tooltip: "" }
    ];

    const respondToSearchboxChange = () => {
      const input = document.querySelector(".tag-input").value;
      let searchResults = [];

      if (input.length > 0) {
        searchResults = data.filter((item) =>
          item.name.toLowerCase().startsWith(input)
        );
      }

      document.querySelector("ul#results").innerHTML = searchResults
        .map(
          (result) =>
            `<li><a href="https://en.wikipedia.org/wiki/${result}" target="_blank" rel="noreferrer">${result}</a></li>`
        )
        .join("");
    };

    const setSuggestionDropdown = (tagData) => {
      // const getTypeFromCSSClass = /(?<=--).*$/;

      const tagTypes = [...new Set(tagData.map((item) => item.type))];

      tagTypes.forEach((item, index) => {
        console.log("---", item);
        const activeClass = index === 0 ? "active" : "";
        // Add dynamic tab header
        const dropdownHeadTab = create("div", {
          className: `tags-dropdown_head--${item} ${activeClass}`
        });
        dropdownHead.appendChild(dropdownHeadTab);

        // Add dynamic tab types like: function, property, operator
        const dropdownContentTab = create("div", {
          className: `tags-dropdown_content-${item} ${activeClass}`
        });
        dropdownContent.appendChild(dropdownContentTab);
      });

      // Add dynamic tab types like: function, property, operator
      tagTypes.forEach((item, index) => {
        const activeClass = index === 0 ? "active" : "";
        const dropdownTab = create("div", {
          className: `tags-dropdown_content-${item} ${activeClass}`
        });
        dropdownContent.appendChild(dropdownTab);
      });

      tagData.forEach((item) => {
        // const typeFromCSS = `tags-dropdown_head--${item.type}`.match(
        //   getTypeFromCSSClass
        // );

        const tab = document.querySelector(
          `.tags-dropdown_content-${item.type}`
        );

        const tagItem = document.createElement("div");
        tagItem.className = `tags-dropdown--item ${item.type}`;
        tagItem.textContent = item.name;
        tagItem.setAttribute("data-value", item.value);
        tagItem.setAttribute("title", item.tooltip);
        tab.appendChild(tagItem);
      });
    };

    /*
    const suggestionItemTemplate = (tagData, tagType) => {
      // Remove all child items from dropdown
      // dropdown.querySelectorAll("*").forEach((n) => n.remove());

      tagData.forEach((item) => {
        console.log("suggestionItemTemplate", tagType);
        if (item.type === tagType) {
          const tagItem = document.createElement("div");
          tagItem.className = `tags-dropdown--item ${tagType}`;
          tagItem.textContent = item.name;
          tagItem.setAttribute("data-value", item.value);
          tagItem.setAttribute("title", item.tooltip);
          tagItem.setAttribute("data-title", item.tooltip);
          dropdown.appendChild(tagItem);
        }
      });

      dropdown.classList.add("open");
    };
    */

    const onTagsInputHandler = (e) => {
      e.preventDefault();
      const elemClass = e.target.className;
      if (elemClass === "tag__remove") {
        const tag = e.target.parentNode;
        const name = $(".tag__name", tag);
        wrap.removeChild(tag);
        tagsArray.splice(tagsArray.indexOf(name.textContent), 1);
        el.value = tagsArray.join(",");
        updateExpression();
      } else if (elemClass === "tag-input") {
        const unique = [...new Set(data.map((item) => item.type))];
        // currentTagType = tagsArray.length === 0 ? "properties" : "operators";
        currentTagType = unique[0];
        setActiveDropdown(currentTagType);
        dropdown.classList.add("open");
        // suggestionItemTemplate(data, currentTagType);
      }
      field.focus();
    };

    const resetDropdownTabs = () => {
      const tagTypes = [...new Set(data.map((item) => item.type))];

      tagTypes.forEach((item, index) => {
        document
          .querySelector(`.tags-dropdown_head--${item}`)
          .classList.remove("active");
      });
    };

    const resetContentTabs = () => {
      const tagTypes = [...new Set(data.map((item) => item.type))];

      tagTypes.forEach((item) => {
        console.log("item", item);
        document
          .querySelector(`.tags-dropdown_content-${item}`)
          .classList.remove("active");
      });
    };

    const keyHandler = (e) => {
      const input = document.querySelector(".tag-input").value;
      // console.log("+++" + String.fromCharCode(e.keyCode).toLowerCase(), input);
      if (e.target.tagName === "INPUT" && e.target.className === "tag-input") {
        const target = e.target;
        const code = e.which || e.keyCode;

        if (field.previousSibling && code !== KEYS.BACK) {
          removeClass("tag--marked", field.previousSibling);
        }

        const name = target.value.trim();

        // if(code === KEYS.ENTER || code === KEYS.COMMA) {
        if (code === KEYS.ENTER) {
          target.blur();

          addTag(name);

          if (timer) clearTimeout(timer);
          timer = setTimeout(function () {
            target.focus();
          }, 10);
        } else if (code === KEYS.BACK) {
          if (e.target.value === "" && !isPressed) {
            isPressed = true;
            removeTag();
          }
        }
      }
    };

    const backHandler = (e) => {
      isPressed = false;
    };

    const addTag = (name) => {
      // delete comma if comma exists
      // name = name.toString().replace(/,/g, "").trim();

      if (name === "") return (field.value = "");

      // if (~tagsArray.indexOf(name)) {
      //   const exist = $$(".tag", wrap);

      //   Array.prototype.forEach.call(exist, function (tag) {
      //     if (tag.firstChild.textContent === name) {
      //       addClass("tag--exists", tag);

      //       if (transitionEnd) {
      //         oneListener(tag, transitionEnd, function () {
      //           removeClass("tag--exists", tag);
      //         });
      //       } else {
      //         removeClass("tag--exists", tag);
      //       }
      //     }
      //   });
      //   return (field.value = "");
      // }

      const tag = createTag(name);
      wrap.insertBefore(tag, entry);
      tagsArray.push(name);
      field.value = "";
      el.value += el.value === "" ? name : "," + name;

      updateExpression();
    };

    const removeTag = () => {
      if (tagsArray.length === 0) return;

      const tags = $$(".tag", wrap);
      const tag = tags[tags.length - 1];

      // if (!hasClass("tag--marked", tag)) {
      //   addClass("tag--marked", tag);
      //   return;
      // }

      tagsArray.pop();

      wrap.removeChild(tag);

      // console.log("removeTag: ", tagsArray);

      el.value = tagsArray.join(",");

      updateExpression();
    };

    const updateExpression = () => {
      tagsExpression = tagsArray.join(" ");
      const tagsPreview = document.querySelector(".tags-preview");
      addClass("active", tagsPreview);
      tagsPreview.innerHTML = tagsExpression;
    };

    init();

    /* Public API */
    getTags: () => {
      return tagsArray;
    };

    clearTags: () => {
      if (!el.instance) return;

      tagsArray.length = 0;
      el.value = "";
      wrap.innerHTML = "";
      wrap.appendChild(field);
    };

    addTags: (name) => {
      if (!el.instance) return;

      if (Array.isArray(name)) {
        for (var i = 0, len = name.length; i < len; i++) {
          addTag(name[i]);
        }
      } else {
        addTag(name);
      }
      return tagsArray;
    };

    destroy: () => {
      if (!el.instance) return;

      wrap.removeEventListener("click", btnRemove, false);
      wrap.removeEventListener("keydown", keyHandler, false);
      wrap.removeEventListener("keyup", keyHandler, false);

      wrap.parentNode.removeChild(wrap);

      el.type = type;

      type = null;
      tagsArray = null;
      timer = null;
      wrap = null;
      field = null;

      delete el.instance;
    };
  };

  window.Tags = Tags;
})();
