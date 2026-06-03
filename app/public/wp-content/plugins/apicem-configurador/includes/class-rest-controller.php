<?php
defined( 'ABSPATH' ) || exit;

class Apicem_REST_Controller {

	public static function register_routes() {
		register_rest_route( 'apicem/v1', '/config', [
			'methods'             => 'GET',
			'callback'            => [ __CLASS__, 'get_config' ],
			'permission_callback' => '__return_true',
		] );
	}

	public static function get_config() {
		$data = self::build_config();
		$response = new WP_REST_Response( $data, 200 );
		$response->header( 'Cache-Control', 'no-cache, no-store' );
		return $response;
	}

	public static function build_config() {
		return [
			'tamanhos'       => self::get_tamanhos(),
			'bordas'         => self::get_bordas(),
			'acabamentos'    => self::get_acabamentos(),
			'wizard'         => [ 'steps' => self::get_wizard_steps() ],
			'hero'           => self::get_hero(),
			'caixa_eletrica' => self::get_caixa(),
			'whatsapp'       => self::get_whatsapp(),
			'lead'           => self::get_lead(),
			'integracoes'    => self::get_integracoes(),
			'entrega'        => self::get_entrega(),
		];
	}

	private static function query( $type ) {
		return get_posts( [
			'post_type'      => $type,
			'post_status'    => 'publish',
			'numberposts'    => -1,
			'orderby'        => 'menu_order',
			'order'          => 'ASC',
			'meta_query'     => [
				[ 'key' => '_apicem_ativo', 'value' => '1', 'compare' => '=' ],
			],
		] );
	}

	private static function get_tamanhos() {
		return array_map( function( $p ) {
			return [
				'id'               => $p->ID,
				'title'            => $p->post_title,
				'largura_cm'       => (int) get_post_meta( $p->ID, '_apicem_largura_cm', true ),
				'profundidade_cm'  => (int) get_post_meta( $p->ID, '_apicem_profundidade_cm', true ),
				'preco'            => get_post_meta( $p->ID, '_apicem_preco', true ),
				'menu_order'       => (int) $p->menu_order,
			];
		}, self::query( 'apicem_tamanho' ) );
	}

	private static function get_bordas() {
		return array_map( function( $p ) {
			$img_id = (int) get_post_meta( $p->ID, '_apicem_imagem', true );
			return [
				'id'         => $p->ID,
				'title'      => $p->post_title,
				'descricao'  => get_post_meta( $p->ID, '_apicem_descricao', true ),
				'perfil'     => get_post_meta( $p->ID, '_apicem_perfil', true ),
				'imagem_url' => $img_id ? wp_get_attachment_url( $img_id ) : null,
				'menu_order' => (int) $p->menu_order,
			];
		}, self::query( 'apicem_borda' ) );
	}

	private static function get_acabamentos() {
		return array_map( function( $p ) {
			$tex_id = (int) get_post_meta( $p->ID, '_apicem_textura', true );
			return [
				'id'          => $p->ID,
				'title'       => $p->post_title,
				'hex'         => get_post_meta( $p->ID, '_apicem_hex', true ),
				'tipo'        => get_post_meta( $p->ID, '_apicem_tipo', true ),
				'textura_url' => $tex_id ? wp_get_attachment_url( $tex_id ) : null,
				'menu_order'  => (int) $p->menu_order,
			];
		}, self::query( 'apicem_acabamento' ) );
	}

	private static function get_wizard_steps() {
		$steps = get_option( 'apicem_wizard', [] );
		return array_values( array_filter( $steps, fn( $s ) => ! empty( $s['ativo'] ) ) );
	}

	private static function get_hero() {
		$h = get_option( 'apicem_hero', [] );
		$media_id = (int) ( $h['media_id'] ?? 0 );
		return [
			'h1'         => $h['h1'] ?? '',
			'h2'         => $h['h2'] ?? '',
			'cta_texto'  => $h['cta_texto'] ?? 'Monte a sua',
			'media_url'  => $media_id ? wp_get_attachment_url( $media_id ) : null,
			'media_type' => $media_id ? get_post_mime_type( $media_id ) : null,
		];
	}

	private static function get_caixa() {
		return get_option( 'apicem_caixa_eletrica', [
			'ativo' => true, 'label' => 'Caixa elétrica', 'texto' => '', 'preco' => null,
		] );
	}

	private static function get_whatsapp() {
		return get_option( 'apicem_whatsapp', [ 'telefone' => '', 'template' => '' ] );
	}

	private static function get_lead() {
		return get_option( 'apicem_lead', [] );
	}

	private static function get_integracoes() {
		return get_option( 'apicem_integracoes', [ 'ga4_id' => '', 'pixel_id' => '' ] );
	}

	private static function get_entrega() {
		return get_option( 'apicem_entrega', [ 'cep_autocomplete' => true ] );
	}
}
