import "./Tags.js";
import "./tags.scss";
import "./styles.css";

document.getElementById("app").innerHTML = `
  <div style="width: 300px">
    <h2 style="margin: 0 10px 0 0">Expression editor</h2>
    <form action="" class="expression-editor" method="post">
      <label for="exist-values">
        <input type="text" id="exist-values" class="tagged1 form-control" data-mode="edit" name="tag-1" value="" dataSource="dataJson" placeholder="Add Expressions">
      </label>
    </form>

    <form action="" class="expression-editor" method="post">
      <label for="exist-values">
        <input type="text" id="exist-values1" class="tagged2 form-control" data-mode="edit" name="tag-2" value="" placeholder="Add Expressions">
      </label>
    </form>

    <form action="" class="expression-editor" method="post">
    <label for="exist-values">
      <input type="text" id="exist-values1" class="tagged3 form-control" data-mode="read" name="tag-2" value="" placeholder="Add Expressions">
    </label>
    </form>
  </div>
`;

const dataJson = {};
const dataJson1 = {};

alert(Tags);

const tag1 = new Tags(".tagged1");

const tag2 = new Tags(".tagged2");

const tag3 = new Tags(".tagged3");

// setInterval(() => {
//   console.log("Tags: ", tags.getTags());
// }, 1000);
