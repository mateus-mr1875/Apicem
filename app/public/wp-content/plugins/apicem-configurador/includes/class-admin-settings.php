<?php
defined( 'ABSPATH' ) || exit;

class Apicem_Admin_Settings {

	private static $tabs = [
		'wizard'         => 'Wizard',
		'hero'           => 'Herói',
		'caixa_eletrica' => 'Caixa Elétrica',
		'whatsapp'       => 'WhatsApp',
		'lead'           => 'Lead / LGPD',
		'integracoes'    => 'Integrações',
		'entrega'        => 'Entrega',
	];

	public static function register_menu() {
		add_menu_page(
			'Apicem',
			'Apicem',
			'manage_options',
			'apicem_menu',
			[ __CLASS__, 'render_settings_page' ],
			'dashicons-admin-customizer',
			30
		);
		add_submenu_page( 'apicem_menu', 'Configurações', 'Configurações', 'manage_options', 'apicem_menu', [ __CLASS__, 'render_settings_page' ] );
	}

	public static function register_settings() {
		// Register all groups unconditionally (avoids "options page not found" error)
		register_setting( 'apicem_wizard_group',   'apicem_wizard',         [ __CLASS__, 'sanitize_wizard' ] );
		register_setting( 'apicem_hero_group',     'apicem_hero',           [ __CLASS__, 'sanitize_hero' ] );
		register_setting( 'apicem_caixa_group',    'apicem_caixa_eletrica', [ __CLASS__, 'sanitize_caixa' ] );
		register_setting( 'apicem_whatsapp_group', 'apicem_whatsapp',       [ __CLASS__, 'sanitize_whatsapp' ] );
		register_setting( 'apicem_lead_group',     'apicem_lead',           [ __CLASS__, 'sanitize_lead' ] );
		register_setting( 'apicem_integracoes_group', 'apicem_integracoes', [ __CLASS__, 'sanitize_integracoes' ] );
		register_setting( 'apicem_entrega_group',  'apicem_entrega',        [ __CLASS__, 'sanitize_entrega' ] );
	}

	public static function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) return;

		$current_tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'wizard';
		if ( ! array_key_exists( $current_tab, self::$tabs ) ) $current_tab = 'wizard';

		// Handle reset action
		if ( isset( $_POST['apicem_reset'] ) && check_admin_referer( 'apicem_reset_action' ) ) {
			Apicem_Seed::reset();
			Apicem_Seed::run();
			echo '<div class="notice notice-success"><p>Dados redefinidos para o padrão.</p></div>';
		}

		echo '<div class="wrap apicem-settings-wrap">';
		echo '<h1>Configurações Apicem</h1>';

		// Tabs nav
		echo '<nav class="nav-tab-wrapper">';
		foreach ( self::$tabs as $tab_key => $tab_label ) {
			$url    = admin_url( 'admin.php?page=apicem_menu&tab=' . $tab_key );
			$active = ( $tab_key === $current_tab ) ? ' nav-tab-active' : '';
			echo '<a href="' . esc_url( $url ) . '" class="nav-tab' . $active . '">' . esc_html( $tab_label ) . '</a>';
		}
		echo '</nav>';

		echo '<div class="apicem-tab-content">';

		$method = 'render_tab_' . $current_tab;
		$group  = 'apicem_' . ( $current_tab === 'caixa_eletrica' ? 'caixa' : ( $current_tab === 'integracoes' ? 'integracoes' : $current_tab ) ) . '_group';

		echo '<form method="post" action="options.php" enctype="multipart/form-data">';
		settings_fields( $group );
		if ( method_exists( __CLASS__, $method ) ) {
			self::$method();
		}
		submit_button( 'Salvar' );
		echo '</form>';

		// Reset button (separate form)
		echo '<hr style="margin-top:40px"><h3>Redefinir dados de seed</h3>';
		echo '<p class="description">Remove todos os itens de CPT e opções, e reinicia com os valores padrão. Use apenas em desenvolvimento.</p>';
		echo '<form method="post"><input type="hidden" name="apicem_reset" value="1">';
		wp_nonce_field( 'apicem_reset_action' );
		submit_button( 'Redefinir para padrão', 'delete', 'submit', false );
		echo '</form>';

		echo '</div></div>';
	}

	// ── Tab renderers ─────────────────────────────────────────────────────

	private static function render_tab_wizard() {
		$steps = get_option( 'apicem_wizard', [] );
		echo '<h2>Passos do Wizard</h2>';
		echo '<p class="description">Ative/desative e edite os textos de cada passo. A ordem é definida aqui (reordenação via arrastar disponível nos CPTs para as opções).</p>';
		echo '<table class="widefat apicem-wizard-table"><thead><tr><th>#</th><th>Ativo</th><th>Kicker</th><th>Título</th><th>Texto de apoio</th></tr></thead><tbody>';
		foreach ( $steps as $i => $step ) {
			$n = esc_attr( $i );
			echo '<tr>';
			echo '<td>' . esc_html( $step['numero'] ) . '</td>';
			echo '<td><input type="checkbox" name="apicem_wizard[' . $n . '][ativo]" value="1" ' . ( $step['ativo'] ? 'checked' : '' ) . '></td>';
			echo '<td><input type="text" name="apicem_wizard[' . $n . '][kicker]" value="' . esc_attr( $step['kicker'] ) . '" class="regular-text"></td>';
			echo '<td><input type="text" name="apicem_wizard[' . $n . '][titulo]" value="' . esc_attr( $step['titulo'] ) . '" class="regular-text"></td>';
			echo '<td><textarea name="apicem_wizard[' . $n . '][texto_apoio]" rows="2" class="large-text">' . esc_textarea( $step['texto_apoio'] ) . '</textarea></td>';
			// Pass through read-only fields
			echo '<input type="hidden" name="apicem_wizard[' . $n . '][numero]" value="' . esc_attr( $step['numero'] ) . '">';
			echo '<input type="hidden" name="apicem_wizard[' . $n . '][slug]" value="' . esc_attr( $step['slug'] ) . '">';
			echo '</tr>';
		}
		echo '</tbody></table>';
	}

	private static function render_tab_hero() {
		$hero = get_option( 'apicem_hero', [] );
		$media_id  = $hero['media_id'] ?? 0;
		$media_url = $media_id ? wp_get_attachment_url( $media_id ) : '';
		?>
		<h2>Herói (Passo 1)</h2>
		<table class="form-table">
			<tr><th>H1</th><td><input type="text" name="apicem_hero[h1]" value="<?php echo esc_attr( $hero['h1'] ?? '' ); ?>" class="large-text"></td></tr>
			<tr><th>H2 / lead</th><td><textarea name="apicem_hero[h2]" rows="3" class="large-text"><?php echo esc_textarea( $hero['h2'] ?? '' ); ?></textarea></td></tr>
			<tr><th>Texto do CTA</th><td><input type="text" name="apicem_hero[cta_texto]" value="<?php echo esc_attr( $hero['cta_texto'] ?? 'Monte a sua' ); ?>" class="regular-text"></td></tr>
			<tr><th>Imagem / Vídeo</th><td>
				<input type="hidden" name="apicem_hero[media_id]" id="apicem_hero_media_id" value="<?php echo esc_attr( $media_id ); ?>">
				<div id="apicem_hero_media_preview">
					<?php if ( $media_url ) echo '<img src="' . esc_url( $media_url ) . '" style="max-width:300px;display:block;margin-bottom:8px">'; ?>
				</div>
				<button type="button" class="button apicem-media-btn" data-target="apicem_hero_media_id" data-preview="apicem_hero_media_preview">Selecionar mídia</button>
				<?php if ( $media_id ) : ?><button type="button" class="button apicem-media-remove" data-target="apicem_hero_media_id" data-preview="apicem_hero_media_preview">Remover</button><?php endif; ?>
				<p class="description">Deixe em branco para exibir o placeholder SVG on-brand.</p>
			</td></tr>
		</table>
		<?php
	}

	private static function render_tab_caixa_eletrica() {
		$c = get_option( 'apicem_caixa_eletrica', [] );
		?>
		<h2>Caixa Elétrica (Passo 5)</h2>
		<table class="form-table">
			<tr><th>Passo ativo</th><td><input type="checkbox" name="apicem_caixa_eletrica[ativo]" value="1" <?php checked( $c['ativo'] ?? true ); ?>></td></tr>
			<tr><th>Rótulo</th><td><input type="text" name="apicem_caixa_eletrica[label]" value="<?php echo esc_attr( $c['label'] ?? '' ); ?>" class="regular-text"></td></tr>
			<tr><th>Texto de apoio</th><td><textarea name="apicem_caixa_eletrica[texto]" rows="2" class="large-text"><?php echo esc_textarea( $c['texto'] ?? '' ); ?></textarea></td></tr>
			<tr><th>Preço (R$) <em style="font-weight:normal;color:#888">— Fase 2</em></th><td><input type="text" name="apicem_caixa_eletrica[preco]" value="<?php echo esc_attr( $c['preco'] ?? '' ); ?>" class="small-text" placeholder="0,00"></td></tr>
		</table>
		<?php
	}

	private static function render_tab_whatsapp() {
		$w = get_option( 'apicem_whatsapp', [] );
		?>
		<h2>WhatsApp</h2>
		<?php if ( empty( $w['telefone'] ) ) : ?>
		<div class="notice notice-warning inline"><p>Número do WhatsApp não configurado. O botão de envio ficará desabilitado no site.</p></div>
		<?php endif; ?>
		<table class="form-table">
			<tr><th>Número (DDI+DDD+número)</th><td>
				<input type="text" name="apicem_whatsapp[telefone]" value="<?php echo esc_attr( $w['telefone'] ?? '' ); ?>" class="regular-text" placeholder="5511999999999">
				<p class="description">Formato internacional sem +. Ex.: 5511999999999</p>
			</td></tr>
			<tr><th>Template da mensagem</th><td>
				<textarea name="apicem_whatsapp[template]" rows="8" class="large-text"><?php echo esc_textarea( $w['template'] ?? '' ); ?></textarea>
				<p class="description">Variáveis: {tamanho} {borda} {acabamento} {sim_nao} {cep} {cidade} {uf} {nome} {email} {telefone}</p>
			</td></tr>
		</table>
		<?php
	}

	private static function render_tab_lead() {
		$l = get_option( 'apicem_lead', [] );
		$campos = $l['campos'] ?? [ 'nome', 'telefone', 'email' ];
		$labels = $l['labels'] ?? [];
		?>
		<h2>Formulário de Lead / LGPD</h2>
		<table class="form-table">
			<tr><th>Campos exibidos</th><td>
				<?php foreach ( [ 'nome' => 'Nome', 'telefone' => 'Telefone', 'email' => 'E-mail' ] as $key => $def ) : ?>
				<label><input type="checkbox" name="apicem_lead[campos][]" value="<?php echo esc_attr( $key ); ?>" <?php checked( in_array( $key, $campos, true ) ); ?>> <?php echo esc_html( $def ); ?></label><br>
				<?php endforeach; ?>
			</td></tr>
			<tr><th>Label — Nome</th><td><input type="text" name="apicem_lead[labels][nome]" value="<?php echo esc_attr( $labels['nome'] ?? 'Nome completo' ); ?>" class="regular-text"></td></tr>
			<tr><th>Label — Telefone</th><td><input type="text" name="apicem_lead[labels][telefone]" value="<?php echo esc_attr( $labels['telefone'] ?? 'WhatsApp / Telefone' ); ?>" class="regular-text"></td></tr>
			<tr><th>Label — E-mail</th><td><input type="text" name="apicem_lead[labels][email]" value="<?php echo esc_attr( $labels['email'] ?? 'E-mail' ); ?>" class="regular-text"></td></tr>
			<tr><th>Texto de consentimento LGPD</th><td><input type="text" name="apicem_lead[lgpd_texto]" value="<?php echo esc_attr( $l['lgpd_texto'] ?? '' ); ?>" class="large-text"></td></tr>
			<tr><th>Link da Política de Privacidade</th><td><input type="text" name="apicem_lead[politica_url]" value="<?php echo esc_attr( $l['politica_url'] ?? '/politica-de-privacidade' ); ?>" class="regular-text"></td></tr>
		</table>
		<?php
	}

	private static function render_tab_integracoes() {
		$i = get_option( 'apicem_integracoes', [] );
		?>
		<h2>Integrações de Rastreamento</h2>
		<p class="description">Os scripts só são carregados se o ID estiver preenchido.</p>
		<table class="form-table">
			<tr><th>GA4 Measurement ID</th><td><input type="text" name="apicem_integracoes[ga4_id]" value="<?php echo esc_attr( $i['ga4_id'] ?? '' ); ?>" class="regular-text" placeholder="G-XXXXXXXXXX"></td></tr>
			<tr><th>Meta Pixel ID</th><td><input type="text" name="apicem_integracoes[pixel_id]" value="<?php echo esc_attr( $i['pixel_id'] ?? '' ); ?>" class="regular-text" placeholder="000000000000000"></td></tr>
		</table>
		<?php
	}

	private static function render_tab_entrega() {
		$e = get_option( 'apicem_entrega', [] );
		?>
		<h2>Entrega / CEP</h2>
		<table class="form-table">
			<tr><th>Autocomplete de CEP (ViaCEP)</th><td><input type="checkbox" name="apicem_entrega[cep_autocomplete]" value="1" <?php checked( $e['cep_autocomplete'] ?? true ); ?>> <span class="description">Preenche cidade e estado automaticamente ao digitar o CEP.</span></td></tr>
		</table>
		<?php
	}

	// ── Sanitizers ────────────────────────────────────────────────────────

	public static function sanitize_wizard( $input ) {
		if ( ! is_array( $input ) ) return get_option( 'apicem_wizard' );
		$clean = [];
		foreach ( $input as $i => $step ) {
			$clean[] = [
				'numero'      => absint( $step['numero'] ?? $i + 1 ),
				'slug'        => sanitize_key( $step['slug'] ?? '' ),
				'ativo'       => ! empty( $step['ativo'] ),
				'kicker'      => sanitize_text_field( $step['kicker'] ?? '' ),
				'titulo'      => sanitize_text_field( $step['titulo'] ?? '' ),
				'texto_apoio' => sanitize_textarea_field( $step['texto_apoio'] ?? '' ),
			];
		}
		return $clean;
	}

	public static function sanitize_hero( $input ) {
		return [
			'h1'        => sanitize_text_field( $input['h1'] ?? '' ),
			'h2'        => sanitize_textarea_field( $input['h2'] ?? '' ),
			'cta_texto' => sanitize_text_field( $input['cta_texto'] ?? 'Monte a sua' ),
			'media_id'  => absint( $input['media_id'] ?? 0 ),
		];
	}

	public static function sanitize_caixa( $input ) {
		return [
			'ativo' => ! empty( $input['ativo'] ),
			'label' => sanitize_text_field( $input['label'] ?? '' ),
			'texto' => sanitize_textarea_field( $input['texto'] ?? '' ),
			'preco' => sanitize_text_field( $input['preco'] ?? '' ),
		];
	}

	public static function sanitize_whatsapp( $input ) {
		return [
			'telefone' => preg_replace( '/\D/', '', $input['telefone'] ?? '' ),
			'template' => sanitize_textarea_field( $input['template'] ?? '' ),
		];
	}

	public static function sanitize_lead( $input ) {
		$allowed = [ 'nome', 'telefone', 'email' ];
		$campos  = array_intersect( (array) ( $input['campos'] ?? [] ), $allowed );
		$labels  = $input['labels'] ?? [];
		return [
			'campos'      => array_values( $campos ),
			'labels'      => [
				'nome'     => sanitize_text_field( $labels['nome'] ?? 'Nome completo' ),
				'telefone' => sanitize_text_field( $labels['telefone'] ?? 'Telefone' ),
				'email'    => sanitize_text_field( $labels['email'] ?? 'E-mail' ),
			],
			'lgpd_texto'  => sanitize_text_field( $input['lgpd_texto'] ?? '' ),
			'politica_url' => esc_url_raw( $input['politica_url'] ?? '' ),
		];
	}

	public static function sanitize_integracoes( $input ) {
		return [
			'ga4_id'   => sanitize_text_field( $input['ga4_id'] ?? '' ),
			'pixel_id' => sanitize_text_field( $input['pixel_id'] ?? '' ),
		];
	}

	public static function sanitize_entrega( $input ) {
		return [ 'cep_autocomplete' => ! empty( $input['cep_autocomplete'] ) ];
	}
}
