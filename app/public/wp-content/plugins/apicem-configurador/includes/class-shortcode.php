<?php
defined( 'ABSPATH' ) || exit;

class Apicem_Shortcode {

	public static function register() {
		add_shortcode( 'apicem_configurador', [ __CLASS__, 'render' ] );
		add_action( 'enqueue_block_editor_assets', [ __CLASS__, 'register_block' ] );
		register_block_type( APICEM_PATH . 'blocks/configurador', [
			'render_callback' => [ __CLASS__, 'render' ],
		] );
	}

	public static function render( $atts = [] ) {
		self::enqueue_assets();
		ob_start();
		?>
		<div id="apicem-configurador" class="apicem-configurador" role="main" aria-label="Configurador de mesa Apicem">
			<div class="apicem-layout">
				<div class="apicem-preview-col" aria-hidden="true">
					<div class="apicem-preview-sticky">
						<div class="apicem-preview-wrap">
							<!-- SVG preview injected by preview.js -->
						</div>
						<div class="apicem-preview-caption"></div>
					</div>
				</div>
				<div class="apicem-step-col">
					<div class="apicem-stepper" role="navigation" aria-label="Progresso do configurador"></div>
					<div class="apicem-step-content"></div>
				</div>
			</div>
			<!-- Step 7 modal -->
			<div class="apicem-modal-overlay" id="apicem-modal" role="dialog" aria-modal="true" aria-labelledby="apicem-modal-title" hidden>
				<div class="apicem-modal">
					<button class="apicem-modal-close" aria-label="Fechar">&times;</button>
					<div class="apicem-modal-body"></div>
				</div>
			</div>
		</div>
		<?php
		return ob_get_clean();
	}

	private static function enqueue_assets() {
		if ( wp_script_is( 'apicem-configurador', 'enqueued' ) ) return;

		wp_enqueue_style(
			'apicem-configurador',
			APICEM_URL . 'assets/css/configurador.css',
			[],
			APICEM_VERSION
		);

		wp_enqueue_script(
			'apicem-preview',
			APICEM_URL . 'assets/js/preview.js',
			[],
			APICEM_VERSION,
			true
		);

		wp_enqueue_script(
			'apicem-configurador',
			APICEM_URL . 'assets/js/configurador.js',
			[ 'apicem-preview' ],
			APICEM_VERSION,
			true
		);

		$config = Apicem_REST_Controller::build_config();
		$integracoes = $config['integracoes'];

		wp_localize_script( 'apicem-configurador', 'apicemConfig', array_merge( $config, [
			'pluginUrl' => APICEM_URL,
			'nonce'     => wp_create_nonce( 'apicem_front' ),
		] ) );

		// Enqueue GA4
		if ( ! empty( $integracoes['ga4_id'] ) ) {
			$ga4_id = esc_js( $integracoes['ga4_id'] );
			wp_enqueue_script( 'apicem-gtag', 'https://www.googletagmanager.com/gtag/js?id=' . $ga4_id, [], null, false );
			wp_add_inline_script( 'apicem-gtag', "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" . $ga4_id . "',{send_page_view:false});" );
		}

		// Enqueue Meta Pixel
		if ( ! empty( $integracoes['pixel_id'] ) ) {
			$pixel_id = esc_js( $integracoes['pixel_id'] );
			wp_add_inline_script( 'apicem-configurador', "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','" . $pixel_id . "');", 'before' );
		}

		// Enqueue admin media uploader JS for meta boxes (only in admin)
		if ( is_admin() ) {
			wp_enqueue_media();
			wp_enqueue_style( 'apicem-admin', APICEM_URL . 'assets/css/admin.css', [], APICEM_VERSION );
		}
	}

	public static function register_block() {
		wp_enqueue_script(
			'apicem-block-editor',
			APICEM_URL . 'blocks/configurador/index.js',
			[ 'wp-blocks', 'wp-element', 'wp-block-editor' ],
			APICEM_VERSION,
			true
		);
	}
}
