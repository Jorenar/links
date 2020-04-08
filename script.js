function createList(parent, list) {
  Object.keys(list).sort((a, b) => {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  }).forEach(function(key) {
    let value = list[key];

    let li = document.createElement('li');
    let details = document.createElement('details');
    let summary = document.createElement('summary');

    summary.innerText = key;
    details.appendChild(summary);
    let ul = document.createElement('ul');

    if (typeof value === 'object' && !(value instanceof Array)) {
      createList(ul, value);
      details.appendChild(ul);
      li.appendChild(details);
    } else {
      let a = document.createElement('a');
      a.innerText = key;
      if (value instanceof Array) {
        a.href = value[0];
        let comment = document.createElement('span');
        comment.innerText = ' -- ' + value[1];
        comment.className = 'comment';
        li.appendChild(a);
        li.appendChild(comment);
      } else {
        a.href = value;
        li.appendChild(a);
      }
    }

    parent.appendChild(li);
  });
}

function init() {
  let ul = document.createElement('ul');
  createList(ul, list);
  document.getElementsByTagName('main')[0].appendChild(ul);

  nodes = Array.prototype.slice.call(document.getElementsByTagName('details'));
}

function collapse() {
  nodes.forEach(x => x.removeAttribute('open'));
}

function expand() {
  nodes.forEach(x => x.setAttribute('open', ''));
}
