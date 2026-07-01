document.getElementById('btn-for').onclick = ForLoop;
document.getElementById('btn-while').onclick = WhileLoop;
document.getElementById('btn-do-while').onclick = DoWhileLoop;
document.getElementById('btn-for-of').onclick = ForOfLoop;
document.getElementById('btn-for-in').onclick = ForInLoop;
document.getElementById('btn-forEach').onclick = ForEachLoop;
document.getElementById('btn-map').onclick = MapLoop;

document.getElementById('btn-fs-create').onclick = FsCreate;
document.getElementById('btn-fs-read').onclick = FsRead;
document.getElementById('btn-fs-update').onclick = FsUpdate;
document.getElementById('btn-fs-delete').onclick = FsDelete;

function showTopic(topicId) {
  const topics = document.getElementsByClassName('topic');
  for (let i = 0; i < topics.length; i++) {
    topics[i].style.display = 'none';
  }
  const activeTopic = document.getElementById(topicId);
  if (activeTopic) {
    activeTopic.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const userLanguage = navigator.language.startsWith('ru') ? 'ru' : 'en';
  await window.streemI18n.loadLocale(userLanguage);
  window.streemTranslation.initTranslationPanel();
});

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

async function FsCreate() {
  try {
    const filePath = await window.electronAPI.selectSaveFileDialog();
    if (!filePath) return;
    
    const result = await window.electronAPI.writeTextFile(filePath, '');
    if (result.success) {
      document.getElementById('file-path').value = filePath;
      document.getElementById('file-content').value = '';
      window.electronAPI.openAlert('Файл успешно создан: ' + filePath, 'success');
    } else {
      window.electronAPI.openAlert('Ошибка при создании файла: ' + result.error, 'error');
    }
  } catch (error) {
    window.electronAPI.openAlert('Сбой: ' + error.message, 'error');
  }
}

async function FsRead() {
  let filePath = document.getElementById('file-path').value.trim();
  if (!filePath) {
    filePath = await window.electronAPI.selectFileDialog();
    if (!filePath) return;
    document.getElementById('file-path').value = filePath;
  }
  
  try {
    const result = await window.electronAPI.readTextFile(filePath);
    if (result.success) {
      document.getElementById('file-content').value = result.content;
      window.electronAPI.openAlert('Файл успешно прочитан!', 'success');
    } else {
      window.electronAPI.openAlert('Ошибка при чтении файла: ' + result.error, 'error');
    }
  } catch (error) {
    window.electronAPI.openAlert('Сбой: ' + error.message, 'error');
  }
}

async function FsUpdate() {
  const filePath = document.getElementById('file-path').value.trim();
  const content = document.getElementById('file-content').value;
  
  if (!filePath) {
    window.electronAPI.openAlert('Укажите путь к файлу!', 'warning');
    return;
  }
  
  try {
    const result = await window.electronAPI.writeTextFile(filePath, content);
    if (result.success) {
      window.electronAPI.openAlert('Файл успешно обновлен!', 'success');
    } else {
      window.electronAPI.openAlert('Ошибка при обновлении файла: ' + result.error, 'error');
    }
  } catch (error) {
    window.electronAPI.openAlert('Сбой: ' + error.message, 'error');
  }
}

async function FsDelete() {
  const filePath = document.getElementById('file-path').value.trim();
  if (!filePath) {
    window.electronAPI.openAlert('Укажите путь к файлу!', 'warning');
    return;
  }
  
  const confirmDelete = confirm('Вы уверены, что хотите удалить файл: ' + filePath + '?');
  if (!confirmDelete) return;

  try {
    const result = await window.electronAPI.deleteFile(filePath);
    if (result.success) {
      document.getElementById('file-content').value = '';
      window.electronAPI.openAlert('Файл успешно удален!', 'success');
    } else {
      window.electronAPI.openAlert('Ошибка при удалении файла: ' + result.error, 'error');
    }
  } catch (error) {
    window.electronAPI.openAlert('Сбой: ' + error.message, 'error');
  }
}
