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

    const tagInputInstanceName = el.getAttribute("id");

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
        className: `tags-container expression-editor-${tagInputInstanceName}`
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

      console.log("mahesh", el.getAttribute("id"));

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
      console.log("****", wrap.className, dropdown.className);
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

      // const tagTypes = [...new Set(data.map((item) => item.type))];

      // tagTypes.forEach((item, index) => {
      //   const elemClass = clickElement.className.includes(
      //     `tags-dropdown_head--${item}`
      //   );

      //   if (elemClass) {
      //     setActiveDropdown(item);
      //   }
      // });
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

    const isValid = (s) => {
      if (s.length % 2 !== 0) return false;

      const stack = [];
      const map = new Map([["(", ")"]]);

      for (let i = 0; i < s.length; i += 1) {
        if (map.has(s[i])) {
          stack.push(map.get(s[i]));
        } else if (s[i] !== stack.pop()) {
          return false;
        }
      }
      return stack.length === 0;
    };

    const data = {
      Categories: ["Project", "Return values", "Global"],
      Functions: [
        {
          Name: "HasChanged",
          Signature: "HasChanged(propertyName)",
          Category: "Project",
          ToolTip:
            "Returns true if the specified property has changed; false otherwise"
        },
        {
          Name: "IsCopy",
          Signature: null,
          Category: "Project",
          ToolTip: "Project is being copied from other project (true/false)"
        },
        {
          Name: "IsFinalize",
          Signature: null,
          Category: "Project",
          ToolTip: "Project is being finalized (true/false)"
        },
        {
          Name: "NewValue",
          Signature: "NewValue(propertyName)",
          Category: "Project",
          ToolTip: "Returns the current value of the specified property"
        },
        {
          Name: "OldValue",
          Signature: "OldValue(propertyName)",
          Category: "Project",
          ToolTip: "Returns the previous value of the specified property"
        },
        {
          Name: "Choose",
          Signature: "Choose(index_num,value1,value2,...)",
          Category: "Global",
          ToolTip:
            "Choose a value or action to perform from a list of values, based on an index number."
        },
        {
          Name: "Concat",
          Signature: "Concat(string1,...)",
          Category: "Global",
          ToolTip: "Concatenates a list or range of text strings."
        },
        {
          Name: "Date",
          Signature: "Date(Year, Month, Day)",
          Category: "Global",
          ToolTip:
            "Returns the date, that corresponds to the specified year, month and date."
        },
        {
          Name: "Day",
          Signature: "Day(Date)",
          Category: "Global",
          ToolTip: "Returns the day of the month, a number from 1 to 31."
        },
        {
          Name: "Hour",
          Signature: "Hour(Date)",
          Category: "Global",
          ToolTip:
            "Returns the hour as a number from 0 (12:00 A.M.) to 23 (11:00 P.M.)."
        },
        {
          Name: "If",
          Signature: "If(condition, truePart, falsePart)",
          Category: "Global",
          ToolTip:
            "Evaluates a condition and returns either the second parameter or the third parameter, depending on the outcome of the condition (same as the Visual Basic `If` function)"
        },
        {
          Name: "Lower",
          Signature: "Lower(string)",
          Category: "Global",
          ToolTip:
            "Converts the value of a specified string to its lowercase equivalent."
        },
        {
          Name: "Minute",
          Signature: "Minute(Date)",
          Category: "Global",
          ToolTip: "Returns the minute, a number from 0 to 59."
        },
        {
          Name: "Month",
          Signature: "Month(Date)",
          Category: "Global",
          ToolTip:
            "Returns the month, a number from 1 (January) to 12 (December)."
        },
        {
          Name: "Now",
          Signature: "Now()",
          Category: "Global",
          ToolTip: "Returns the current date and time."
        },
        {
          Name: "Second",
          Signature: "Second(Date)",
          Category: "Global",
          ToolTip: "Returns the second, a number from 0 to 59."
        },
        {
          Name: "Today",
          Signature: "Today()",
          Category: "Global",
          ToolTip: "Returns the current date."
        },
        {
          Name: "Upper",
          Signature: "Upper(string)",
          Category: "Global",
          ToolTip:
            "Converts the value of a specified string to its uppdercase equivalent."
        },
        {
          Name: "Year",
          Signature: "Year(Date)",
          Category: "Global",
          ToolTip: "Returns the year of a date."
        }
      ],
      Properties: [
        {
          Name: "Account",
          Category: "Project",
          ToolTip: "Account"
        },
        {
          Name: "AccountContact",
          Category: "Project",
          ToolTip: "Contact"
        },
        {
          Name: "AccountName",
          Category: "Project",
          ToolTip: "Account: Name"
        },
        {
          Name: "ActionCode",
          Category: "Project",
          ToolTip: "Action code"
        },
        {
          Name: "ActionCopy",
          Category: "Project",
          ToolTip: "Action (Copy)"
        },
        {
          Name: "AgreementAttachmentContents",
          Category: "Project",
          ToolTip: "AgreementAttachmentContents"
        },
        {
          Name: "AgreementAttachmentFileName",
          Category: "Project",
          ToolTip: "AgreementAttachmentFileName"
        },
        {
          Name: "AgreementDate",
          Category: "Project",
          ToolTip: "Agreement date"
        },
        {
          Name: "AgreementSubject",
          Category: "Project",
          ToolTip: "AgreementSubject"
        },
        {
          Name: "AllowAdditionalInvoicing",
          Category: "Project",
          ToolTip: "Allow additional invoices"
        },
        {
          Name: "AllowCreateProjectInvoiceAsQuoted",
          Category: "Project",
          ToolTip: "AllowCreateProjectInvoiceAsQuoted"
        },
        {
          Name: "AllowMemberEntryOnly",
          Category: "Project",
          ToolTip: "AllowMemberEntryOnly"
        },
        {
          Name: "AutogenerateCode",
          Category: "Project",
          ToolTip: "AutogenerateCode"
        },
        {
          Name: "BlockEntry",
          Category: "Project",
          ToolTip: "BlockEntry"
        },
        {
          Name: "BlockPlanning",
          Category: "Project",
          ToolTip: "BlockPlanning"
        },
        {
          Name: "BlockPurchasing",
          Category: "Project",
          ToolTip: "BlockPurchasing"
        },
        {
          Name: "BlockRebilling",
          Category: "Project",
          ToolTip: "BlockRebilling"
        },
        {
          Name: "BudgetCostsAmountDC",
          Category: "Project",
          ToolTip: "BudgetCostsAmountDC"
        },
        {
          Name: "BudgetedHoursOverrunAction",
          Category: "Project",
          ToolTip: "Budget overrun (Hours)"
        },
        {
          Name: "BudgetSalesAmountDC",
          Category: "Project",
          ToolTip: "BudgetSalesAmountDC"
        },
        {
          Name: "BudgetType",
          Category: "Project",
          ToolTip: "BudgetType"
        },
        {
          Name: "BudgetTypeDescription",
          Category: "Project",
          ToolTip: "Budget type: Description"
        },
        {
          Name: "Classification",
          Category: "Project",
          ToolTip: "Classification"
        },
        {
          Name: "ClassificationDescription",
          Category: "Project",
          ToolTip: "Classification: Description"
        },
        {
          Name: "Code",
          Category: "Project",
          ToolTip: "Code"
        },
        {
          Name: "Created",
          Category: "Project",
          ToolTip: "Created"
        },
        {
          Name: "Creator",
          Category: "Project",
          ToolTip: "Creator"
        },
        {
          Name: "CreatorFullName",
          Category: "Project",
          ToolTip: "Creator: Full name"
        },
        {
          Name: "CustomerPOnumber",
          Category: "Project",
          ToolTip: "CustomerPOnumber"
        },
        {
          Name: "Description",
          Category: "Project",
          ToolTip: "Description"
        },
        {
          Name: "DescriptionTermID",
          Category: "Project",
          ToolTip: "DescriptionTermID"
        },
        {
          Name: "Division",
          Category: "Project",
          ToolTip: "Company"
        },
        {
          Name: "DivisionName",
          Category: "Project",
          ToolTip: "Company: Name"
        },
        {
          Name: "EndDate",
          Category: "Project",
          ToolTip: "End date"
        },
        {
          Name: "FinancialYear",
          Category: "Project",
          ToolTip: "Financial year"
        },
        {
          Name: "FixedPriceItem",
          Category: "Project",
          ToolTip: "Item for fixed price invoicing"
        },
        {
          Name: "FixedPriceItemDescription",
          Category: "Project",
          ToolTip: "Item description"
        },
        {
          Name: "ForceDirty",
          Category: "Project",
          ToolTip: "ForceDirty"
        },
        {
          Name: "ID",
          Category: "Project",
          ToolTip: "ID"
        },
        {
          Name: "IncludeSpecificationInInvoicePdf",
          Category: "Project",
          ToolTip: "64642"
        },
        {
          Name: "InternalNotes",
          Category: "Project",
          ToolTip: "Internal notes"
        },
        {
          Name: "InvoiceAddress",
          Category: "Project",
          ToolTip: "Invoice address"
        },
        {
          Name: "InvoiceAsQuoted",
          Category: "Project",
          ToolTip: "Invoice as quoted"
        },
        {
          Name: "Manager",
          Category: "Project",
          ToolTip: "Manager"
        },
        {
          Name: "ManagerFullname",
          Category: "Project",
          ToolTip: "ManagerFullname"
        },
        {
          Name: "Modified",
          Category: "Project",
          ToolTip: "Modified"
        },
        {
          Name: "Modifier",
          Category: "Project",
          ToolTip: "Modifier"
        },
        {
          Name: "ModifierFullName",
          Category: "Project",
          ToolTip: "Modifier: Full name"
        },
        {
          Name: "Notes",
          Category: "Project",
          ToolTip: "Notes"
        },
        {
          Name: "PaymentCondition",
          Category: "Project",
          ToolTip: "Payment condition"
        },
        {
          Name: "PrepaidItem",
          Category: "Project",
          ToolTip: "Item for prepaid invoicing"
        },
        {
          Name: "PrepaidType",
          Category: "Project",
          ToolTip: "PrepaidType"
        },
        {
          Name: "ProposalDocSubject",
          Category: "Project",
          ToolTip: "ProposalDocSubject"
        },
        {
          Name: "ProposalDocument",
          Category: "Project",
          ToolTip: "Proposal: Document"
        },
        {
          Name: "PurchaseMarkupPercentage",
          Category: "Project",
          ToolTip: "Markup percentage"
        },
        {
          Name: "SalesAmountDC",
          Category: "Project",
          ToolTip: "Price agreement"
        },
        {
          Name: "SalesTimeQuantity",
          Category: "Project",
          ToolTip: "Budgeted time (Hours)"
        },
        {
          Name: "SourceQuotation",
          Category: "Project",
          ToolTip: "SourceQuotation"
        },
        {
          Name: "StartDate",
          Category: "Project",
          ToolTip: "Start date"
        },
        {
          Name: "TimeQuantityToAlert",
          Category: "Project",
          ToolTip: "Alert when exceeding (Hours)"
        },
        {
          Name: "TimeSpecificationType",
          Category: "Project",
          ToolTip: "Include invoice specification"
        },
        {
          Name: "Type",
          Category: "Project",
          ToolTip: "Type"
        },
        {
          Name: "TypeDescription",
          Category: "Project",
          ToolTip: "Type: Description"
        },
        {
          Name: "UseBillingMilestones",
          Category: "Project",
          ToolTip: "UseBillingMilestones"
        },
        {
          Name: "YourRef",
          Category: "Project",
          ToolTip: "Your ref."
        },
        {
          Name: "Result_ApproveSalesOrder",
          Category: "Return values",
          ToolTip: "Result_ApproveSalesOrder"
        },
        {
          Name: "Result_SendEmail",
          Category: "Return values",
          ToolTip: "Result_SendEmail"
        }
      ],
      KeyWords: ["TRUE", "FALSE", "NULL"],
      Operators: [
        "+",
        "-",
        "*",
        "/",
        "(",
        ")",
        "=",
        "<>",
        "<",
        ">",
        "<=",
        ">=",
        "AND",
        "OR",
        "NOT"
      ]
    };

    // const data = [
    //   {
    //     name: "If",
    //     signature: "If(condition, truePart, falsePart)",
    //     type: "function",
    //     category: "Global",
    //     value: "If",
    //     tooltip:
    //       "Evaluates a condition and returns either the second parameter or the third parameter, depending on the outcome of the condition (same as the Visual Basic `If` function)"
    //   },
    //   {
    //     name: "Concat",
    //     type: "function",
    //     category: "Global",
    //     value: "Concat",
    //     tooltip:
    //       "Concat concatenates one or more strings. Example: `Concat('a', 'b', 'c')`"
    //   },
    //   {
    //     name: "Lower",
    //     signature: "Lower(string)",
    //     type: "function",
    //     category: "Global",
    //     value: "Lower",
    //     tooltip:
    //       "`Lower(string)` converts the value of a specified string to its lowercase equivalent."
    //   },
    //   {
    //     name: "Upper",
    //     signature: "Upper(string)",
    //     type: "function",
    //     category: "Global",
    //     value: "Upper",
    //     tooltip:
    //       "`Upper(string)` converts the value of a specified string to its uppercase equivalent."
    //   },
    //   {
    //     name: "Today",
    //     signature: "Today()",
    //     type: "function",
    //     category: "Global",
    //     value: "Today()",
    //     tooltip: "Current date"
    //   },
    //   {
    //     name: "Now",
    //     signature: "Now()",
    //     type: "function",
    //     category: "Global",
    //     value: "Now()",
    //     tooltip: "Current date and time"
    //   },
    //   {
    //     name: "Date",
    //     signature: "Date(year, month, day)",
    //     type: "function",
    //     category: "Global",
    //     value: "Date",
    //     tooltip: "Date from **year**, **month** and **day**"
    //   },
    //   {
    //     name: "Year",
    //     signature: "Year",
    //     type: "function",
    //     category: "Global",
    //     value: "Year",
    //     tooltip: ""
    //   },
    //   {
    //     name: "Month",
    //     signature: "Month",
    //     type: "function",
    //     category: "Global",
    //     value: "Month",
    //     tooltip: ""
    //   },
    //   {
    //     name: "Day",
    //     signature: "Day",
    //     type: "function",
    //     category: "Global",
    //     value: "Day",
    //     tooltip: ""
    //   },
    //   {
    //     name: "Hour",
    //     signature: "Hour",
    //     type: "function",
    //     category: "Global",
    //     value: "Hour",
    //     tooltip: ""
    //   },
    //   {
    //     name: "Minute",
    //     signature: "Minute",
    //     type: "function",
    //     category: "Global",
    //     value: "Minute",
    //     tooltip: ""
    //   },
    //   {
    //     name: "Second",
    //     signature: "Second",
    //     type: "function",
    //     category: "Global",
    //     value: "Second",
    //     tooltip: ""
    //   },
    //   {
    //     name: "AmountDC",
    //     signature: "",
    //     type: "property",
    //     category: "Sales order",
    //     value: "AmountDC",
    //     tooltip: "Amount in default currency"
    //   },
    //   { name: "(", type: "operator", value: "(", tooltip: "" },
    //   { name: ")", type: "operator", value: ")", tooltip: "" },
    //   { name: "+", type: "operator", value: "+", tooltip: "" },
    //   { name: "-", type: "operator", value: "-", tooltip: "" },
    //   { name: "*", type: "operator", value: "*", tooltip: "" },
    //   { name: "/", type: "operator", value: "/", tooltip: "" },
    //   { name: "=", type: "operator", value: "=", tooltip: "" },
    //   { name: "!=", type: "operator", value: "!=", tooltip: "" },
    //   { name: "<>", type: "operator", value: "<>", tooltip: "" },
    //   { name: ">", type: "operator", value: ">", tooltip: "" },
    //   { name: ">=", type: "operator", value: ">=", tooltip: "" },
    //   { name: "<", type: "operator", value: "<", tooltip: "" },
    //   { name: "<=", type: "operator", value: "<=", tooltip: "" }
    // ];

    const setSuggestionDropdown = (tagData) => {
      let allData = [];

      Reflect.ownKeys(tagData).forEach((tData) => {
        // console.log("tData", tData, Reflect.get(tagData, tData));
        // tData.concat(allData);
        // allData.concat(Reflect.get(tagData, tData));
        if (tData !== "Categories") {
          allData.push(...Reflect.get(tagData, tData));
        }
      });

      console.log("---", allData);

      Reflect.ownKeys(tagData).forEach((tData, index) => {
        const activeClass = index === 1 ? "active" : "";
        const lastTagData = Object.keys(tagData).length;

        if (tData !== "Categories") {
          // Add dynamic tab header
          const dropdownHeadTab = create("div", {
            className: `tags-dropdown_head--${tData.toLocaleLowerCase()} ${activeClass}`,
            textContent: tData
          });
          dropdownHead.appendChild(dropdownHeadTab);

          // Add dynamic tab types like: function, property, operator
          const dropdownContentTab = create("div", {
            className: `tags-dropdown_content-item ${tData.toLocaleLowerCase()} ${activeClass}`
          });
          dropdownContent.appendChild(dropdownContentTab);
        }

        if (lastTagData - 1 === index) {
          // Add All tab header
          const dropdownHeadTab = create("div", {
            className: `tags-dropdown_head--all`,
            textContent: "All"
          });
          dropdownHead.appendChild(dropdownHeadTab);

          // Add dynamic tab types like: function, property, operator
          const dropdownContentTab = create("div", {
            className: `tags-dropdown_content-item all`
          });
          dropdownContent.appendChild(dropdownContentTab);
        }

        const cData = Reflect.get(tagData, tData);
        cData.forEach((item, index) => {
          if (tData !== "Categories") {
            const tab = document.querySelector(
              `.tags-dropdown_content-item.${tData.toLocaleLowerCase()}`
            );
            const tagItem = document.createElement("div");
            tagItem.className = `tags-dropdown--item ${tData.toLocaleLowerCase()}`;
            const tagVal = item?.Name || item;
            tagItem.textContent = tagVal;
            tagItem.setAttribute("data-value", tagVal);
            const tagTooltip = item?.Tooltip || item;
            tagItem.setAttribute("title", tagTooltip);
            tab.appendChild(tagItem);
          }
        });

        allData.forEach((item) => {
          const tab = document.querySelector(".tags-dropdown_content-item.all");
          const tagItem = document.createElement("div");
          tagItem.className = `tags-dropdown--item all`;
          const tagVal = item?.Name || item;
          tagItem.textContent = tagVal;
          tagItem.setAttribute("data-value", tagVal);
          const tagTooltip = item?.Tooltip || item;
          tagItem.setAttribute("title", tagTooltip);
          tab?.appendChild(tagItem);
        });
      });

      /*
      tagTypes.forEach((item, index) => {
        const activeClass = index === 0 ? "active" : "";
        // Add dynamic tab header
        const dropdownHeadTab = create("div", {
          className: `tags-dropdown_head--${item} ${activeClass}`,
          textContent: item
        });
        dropdownHead.appendChild(dropdownHeadTab);

        // Add dynamic tab types like: function, property, operator
        const dropdownContentTab = create("div", {
          className: `tags-dropdown_content-${item} ${activeClass}`
        });
        dropdownContent.appendChild(dropdownContentTab);
      });

      tagData.forEach((item) => {
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
      */
    };

    const onTagsInputHandler = (e) => {
      console.log("Wrap", wrap);
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
        // const unique = [...new Set(data.map((item) => item.type))];
        // // currentTagType = tagsArray.length === 0 ? "properties" : "operators";
        // currentTagType = unique[0];
        // setActiveDropdown(currentTagType);
        dropdown.classList.add("open");
      }
      field.focus();
    };

    const resetDropdownTabs = () => {
      // const tagTypes = [...new Set(data.map((item) => item.type))];
      // tagTypes.forEach((item, index) => {
      //   document
      //     .querySelector(`.tags-dropdown_head--${item}`)
      //     .classList.remove("active");
      // });
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
      if (name === "") return (field.value = "");

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
      el.value = tagsArray.join(",");

      updateExpression();
    };

    const updateExpression = () => {
      tagsExpression = tagsArray.join(" ");
      const tagsPreview = document.querySelector(".tags-preview");
      console.log("updateExpression", tagsArray, tagsArray.length);
      addClass("active", tagsPreview);
      tagsPreview.innerHTML = tagsExpression;
      if (!tagsArray.length) {
        removeClass("active", tagsPreview);
      }
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
