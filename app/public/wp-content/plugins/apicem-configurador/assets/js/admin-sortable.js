/* Apicem Admin — CPT drag-to-reorder */
jQuery(function($) {
  var $tbody = $('#the-list');
  if (!$tbody.length) return;

  // Inject drag handle column
  $tbody.find('tr').each(function() {
    var $row = $(this);
    $row.prepend('<td class="apicem-drag-handle" title="Arrastar para reordenar">⠿</td>');
  });

  $tbody.sortable({
    handle: '.apicem-drag-handle',
    placeholder: 'apicem-sortable-placeholder',
    axis: 'y',
    helper: 'clone',
    tolerance: 'pointer',
    update: function() {
      var ids = [];
      $tbody.find('tr').each(function() {
        var id = $(this).find('input[type="checkbox"]').val();
        if (id) ids.push(id);
      });
      $.post(apicemSort.ajaxUrl, {
        action: 'apicem_save_order',
        nonce:  apicemSort.nonce,
        ids:    ids,
      }, function(response) {
        if (response.success) {
          $tbody.closest('table').after('<p class="apicem-sort-ok" style="color:#008a20;font-size:13px">Ordem salva.</p>');
          setTimeout(function(){ $('.apicem-sort-ok').remove(); }, 2000);
        }
      });
    },
  });
});
