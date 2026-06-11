function switchTab(name) {
  document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
  if (event && event.target) event.target.classList.add('active');
  var el = document.getElementById('tab-' + name);
  if (el) el.classList.add('active');
}