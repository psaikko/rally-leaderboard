export function ENode(tag, attributes, children) {
    let e = document.createElement(tag);
    attributes && attributes.forEach(attr => e.setAttribute(...attr));
    children && children.forEach(child => e.appendChild(child));
    return e;
}

export function TNode(text) {
    return document.createTextNode(text);
} 
