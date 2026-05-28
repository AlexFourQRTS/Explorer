//render.js - слушает html



function ForLoop() {
  window.electronAPI.openModal('for');
}

function WhileLoop() {
  window.electronAPI.openModal('while');
}

function DoWhileLoop() {
  window.electronAPI.openModal('do-while');
}

function ForOfLoop() {
  window.electronAPI.openModal('for-of');
}

function ForInLoop() {
  window.electronAPI.openModal('for-in');
}

function ForEachLoop() {
  window.electronAPI.openModal('forEach');
}

function MapLoop() {
  window.electronAPI.openModal('map');
}

// И сами клики
document.getElementById('btn-for').onclick = ForLoop;
document.getElementById('btn-while').onclick = WhileLoop;
document.getElementById('btn-do-while').onclick = DoWhileLoop;
document.getElementById('btn-for-of').onclick = ForOfLoop;
document.getElementById('btn-for-in').onclick = ForInLoop;
document.getElementById('btn-forEach').onclick = ForEachLoop;
document.getElementById('btn-map').onclick = MapLoop;
