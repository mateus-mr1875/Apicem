<?php
defined( 'ABSPATH' ) || exit;

class Apicem_CPT {

	private static $types = [
		'apicem_tamanho'    => [ 'singular' => 'Tamanho',    'plural' => 'Tamanhos',    'menu' => 'Tamanhos' ],
		'apicem_borda'      => [ 'singular' => 'Borda',      'plural' => 'Bordas',      'menu' => 'Bordas' ],
		'apicem_acabamento' => [ 'singular' => 'Acabamento', 'plural' => 'Acabamentos', 'menu' => 'Acabamentos' ],
	];

	public static function register() {
		foreach ( self::$types as $slug => $labels ) {
			register_post_type( $slug, [
				'labels'              => [
					'name'          => $labels['plural'],
					'singular_name' => $labels['singular'],
					'add_new_item'  => 'Adicionar ' . $labels['singular'],
					'edit_item'     => 'Editar ' . $labels['singular'],
					'all_items'     => 'Todos os ' . $labels['plural'],
				],
				'public'              => false,
				'show_ui'             => true,
				'show_in_menu'        => 'apicem_menu',
				'show_in_rest'        => false,
				'supports'            => [ 'title', 'page-attributes' ],
				'menu_position'       => 30,
				'rewrite'             => false,
			] );
		}
	}

	public static function admin_order( $query ) {
		if ( ! is_admin() || ! $query->is_main_query() ) {
			return;
		}
		$post_type = $query->get( 'post_type' );
		if ( in_array( $post_type, array_keys( self::$types ), true ) ) {
			$query->set( 'orderby', 'menu_order' );
			$query->set( 'order', 'ASC' );
		}
	}
}
