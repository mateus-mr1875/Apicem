<?php
/**
 * Plugin Name: Apicem Configurador
 * Plugin URI:  https://apicem.com.br
 * Description: Wizard configurador de mesa sit-stand Apicem — CPTs, painel admin, REST, shortcode e bloco Gutenberg.
 * Version:     1.0.0
 * Author:      Riccó / Apicem
 * Text Domain: apicem
 * License:     GPL-2.0-or-later
 */

defined( 'ABSPATH' ) || exit;

define( 'APICEM_VERSION', '1.0.0' );
define( 'APICEM_PATH',    plugin_dir_path( __FILE__ ) );
define( 'APICEM_URL',     plugin_dir_url( __FILE__ ) );

require_once APICEM_PATH . 'includes/class-cpt.php';
require_once APICEM_PATH . 'includes/class-meta-boxes.php';
require_once APICEM_PATH . 'includes/class-seed.php';
require_once APICEM_PATH . 'includes/class-admin-settings.php';
require_once APICEM_PATH . 'includes/class-admin-sortable.php';
require_once APICEM_PATH . 'includes/class-rest-controller.php';
require_once APICEM_PATH . 'includes/class-shortcode.php';

register_activation_hook( __FILE__, [ 'Apicem_Seed', 'run' ] );

add_action( 'init',             [ 'Apicem_CPT',             'register' ] );
add_action( 'add_meta_boxes',   [ 'Apicem_Meta_Boxes',      'register' ] );
add_action( 'save_post',        [ 'Apicem_Meta_Boxes',      'save' ], 10, 2 );
add_action( 'admin_init',       [ 'Apicem_Admin_Settings',  'register_settings' ] );
add_action( 'admin_menu',       [ 'Apicem_Admin_Settings',  'register_menu' ] );
add_action( 'admin_enqueue_scripts', [ 'Apicem_Admin_Sortable', 'enqueue' ] );
add_action( 'wp_ajax_apicem_save_order', [ 'Apicem_Admin_Sortable', 'save_order' ] );
add_action( 'rest_api_init',    [ 'Apicem_REST_Controller', 'register_routes' ] );
add_action( 'init',             [ 'Apicem_Shortcode',       'register' ] );
add_action( 'pre_get_posts',    [ 'Apicem_CPT',             'admin_order' ] );
add_action( 'admin_enqueue_scripts', 'apicem_admin_global_scripts' );
function apicem_admin_global_scripts( $hook ) {
	$screen = get_current_screen();
	if ( ! $screen ) return;
	// Enqueue media uploader JS on CPT edit screens and settings page
	$is_apicem_screen = (
		( $screen->base === 'post' && in_array( $screen->post_type, [ 'apicem_tamanho', 'apicem_borda', 'apicem_acabamento' ], true ) ) ||
		( $screen->base === 'toplevel_page_apicem_menu' )
	);
	if ( ! $is_apicem_screen ) return;
	wp_enqueue_media();
	wp_enqueue_style( 'apicem-admin', APICEM_URL . 'assets/css/admin.css', [], APICEM_VERSION );
	wp_add_inline_script( 'media-editor', apicem_media_uploader_js() );
}
function apicem_media_uploader_js() {
	return "
jQuery(function($){
  $(document).on('click','.apicem-media-btn',function(e){
    e.preventDefault();
    var targetId  = $(this).data('target');
    var previewId = $(this).data('preview');
    var frame = wp.media({ title:'Selecionar imagem', button:{ text:'Usar esta imagem' }, multiple:false });
    frame.on('select',function(){
      var att = frame.state().get('selection').first().toJSON();
      $('#'+targetId).val(att.id);
      var src = att.sizes && att.sizes.thumbnail ? att.sizes.thumbnail.url : att.url;
      $('#'+previewId).html('<img src=\"'+src+'\" style=\"max-width:120px;display:block;margin-bottom:6px\">');
    });
    frame.open();
  });
  $(document).on('click','.apicem-media-remove',function(e){
    e.preventDefault();
    var targetId  = $(this).data('target');
    var previewId = $(this).data('preview');
    $('#'+targetId).val('');
    $('#'+previewId).html('');
  });
});
";
}
