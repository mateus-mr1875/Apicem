<?php
defined( 'ABSPATH' ) || exit;

class Apicem_Admin_Sortable {

	private static $cpt_list = [ 'apicem_tamanho', 'apicem_borda', 'apicem_acabamento' ];

	public static function enqueue( $hook ) {
		$screen = get_current_screen();
		if ( ! $screen || $screen->base !== 'edit' ) return;
		if ( ! in_array( $screen->post_type, self::$cpt_list, true ) ) return;

		wp_enqueue_script( 'jquery-ui-sortable' );
		wp_enqueue_script(
			'apicem-admin-sortable',
			APICEM_URL . 'assets/js/admin-sortable.js',
			[ 'jquery', 'jquery-ui-sortable' ],
			APICEM_VERSION,
			true
		);
		wp_localize_script( 'apicem-admin-sortable', 'apicemSort', [
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'apicem_sort_nonce' ),
		] );
		wp_enqueue_style( 'apicem-admin', APICEM_URL . 'assets/css/admin.css', [], APICEM_VERSION );
	}

	public static function save_order() {
		check_ajax_referer( 'apicem_sort_nonce', 'nonce' );
		if ( ! current_user_can( 'edit_posts' ) ) wp_send_json_error( 'Unauthorized', 403 );

		$ids = isset( $_POST['ids'] ) ? array_map( 'absint', (array) $_POST['ids'] ) : [];
		foreach ( $ids as $order => $post_id ) {
			wp_update_post( [ 'ID' => $post_id, 'menu_order' => $order ] );
		}
		wp_send_json_success( 'Ordem salva.' );
	}
}
