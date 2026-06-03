<?php
defined( 'ABSPATH' ) || exit;

class Apicem_Meta_Boxes {

	public static function register() {
		add_meta_box( 'apicem_tamanho_fields',    'Dimensões',   [ __CLASS__, 'render_tamanho' ],    'apicem_tamanho',    'normal', 'high' );
		add_meta_box( 'apicem_borda_fields',      'Borda',       [ __CLASS__, 'render_borda' ],      'apicem_borda',      'normal', 'high' );
		add_meta_box( 'apicem_acabamento_fields', 'Acabamento',  [ __CLASS__, 'render_acabamento' ], 'apicem_acabamento', 'normal', 'high' );
	}

	public static function save( $post_id, $post ) {
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
		if ( ! current_user_can( 'edit_post', $post_id ) ) return;

		$handlers = [
			'apicem_tamanho'    => [ __CLASS__, 'save_tamanho' ],
			'apicem_borda'      => [ __CLASS__, 'save_borda' ],
			'apicem_acabamento' => [ __CLASS__, 'save_acabamento' ],
		];

		if ( isset( $handlers[ $post->post_type ] ) ) {
			if ( ! isset( $_POST['_apicem_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_apicem_nonce'] ) ), 'apicem_meta_' . $post_id ) ) return;
			call_user_func( $handlers[ $post->post_type ], $post_id );
		}
	}

	// ── Tamanho ──────────────────────────────────────────────────────────

	public static function render_tamanho( $post ) {
		wp_nonce_field( 'apicem_meta_' . $post->ID, '_apicem_nonce' );
		$largura   = get_post_meta( $post->ID, '_apicem_largura_cm', true );
		$prof      = get_post_meta( $post->ID, '_apicem_profundidade_cm', true );
		$ativo     = get_post_meta( $post->ID, '_apicem_ativo', true );
		$preco     = get_post_meta( $post->ID, '_apicem_preco', true );
		?>
		<table class="form-table apicem-meta-table">
			<tr><th>Largura (cm)</th><td><input type="number" name="_apicem_largura_cm" value="<?php echo esc_attr( $largura ); ?>" class="small-text" min="1"></td></tr>
			<tr><th>Profundidade (cm)</th><td><input type="number" name="_apicem_profundidade_cm" value="<?php echo esc_attr( $prof ); ?>" class="small-text" min="1"></td></tr>
			<tr><th>Ativo</th><td><input type="checkbox" name="_apicem_ativo" value="1" <?php checked( $ativo, '1' ); ?>></td></tr>
			<tr><th>Preço (R$) <em style="font-weight:normal;color:#888">— Fase 2</em></th><td><input type="text" name="_apicem_preco" value="<?php echo esc_attr( $preco ); ?>" class="small-text" placeholder="0,00"></td></tr>
		</table>
		<?php
	}

	private static function save_tamanho( $post_id ) {
		update_post_meta( $post_id, '_apicem_largura_cm',       absint( $_POST['_apicem_largura_cm'] ?? 0 ) );
		update_post_meta( $post_id, '_apicem_profundidade_cm',  absint( $_POST['_apicem_profundidade_cm'] ?? 0 ) );
		update_post_meta( $post_id, '_apicem_ativo',            isset( $_POST['_apicem_ativo'] ) ? '1' : '' );
		update_post_meta( $post_id, '_apicem_preco',            sanitize_text_field( $_POST['_apicem_preco'] ?? '' ) );
	}

	// ── Borda ─────────────────────────────────────────────────────────────

	public static function render_borda( $post ) {
		wp_nonce_field( 'apicem_meta_' . $post->ID, '_apicem_nonce' );
		$descricao = get_post_meta( $post->ID, '_apicem_descricao', true );
		$perfil    = get_post_meta( $post->ID, '_apicem_perfil', true );
		$imagem    = get_post_meta( $post->ID, '_apicem_imagem', true );
		$ativo     = get_post_meta( $post->ID, '_apicem_ativo', true );
		$img_url   = $imagem ? wp_get_attachment_thumb_url( $imagem ) : '';
		?>
		<table class="form-table apicem-meta-table">
			<tr><th>Descrição curta</th><td><input type="text" name="_apicem_descricao" value="<?php echo esc_attr( $descricao ); ?>" class="regular-text"></td></tr>
			<tr><th>Perfil</th><td>
				<select name="_apicem_perfil">
					<?php foreach ( [ 'reta' => 'Reta', 'chanfrada' => 'Chanfrada (Bisel)', 'arredondada' => 'Arredondada' ] as $val => $label ) : ?>
						<option value="<?php echo esc_attr( $val ); ?>" <?php selected( $perfil, $val ); ?>><?php echo esc_html( $label ); ?></option>
					<?php endforeach; ?>
				</select>
			</td></tr>
			<tr><th>Imagem (opcional)</th><td>
				<input type="hidden" name="_apicem_imagem" id="apicem_imagem_id" value="<?php echo esc_attr( $imagem ); ?>">
				<div id="apicem_imagem_preview"><?php if ( $img_url ) echo '<img src="' . esc_url( $img_url ) . '" style="max-width:120px;display:block;margin-bottom:6px">'; ?></div>
				<button type="button" class="button apicem-media-btn" data-target="apicem_imagem_id" data-preview="apicem_imagem_preview">Selecionar imagem</button>
				<?php if ( $imagem ) : ?><button type="button" class="button apicem-media-remove" data-target="apicem_imagem_id" data-preview="apicem_imagem_preview">Remover</button><?php endif; ?>
			</td></tr>
			<tr><th>Ativo</th><td><input type="checkbox" name="_apicem_ativo" value="1" <?php checked( $ativo, '1' ); ?>></td></tr>
		</table>
		<?php
	}

	private static function save_borda( $post_id ) {
		update_post_meta( $post_id, '_apicem_descricao', sanitize_text_field( $_POST['_apicem_descricao'] ?? '' ) );
		$perfis = [ 'reta', 'chanfrada', 'arredondada' ];
		$perfil = in_array( $_POST['_apicem_perfil'] ?? '', $perfis, true ) ? $_POST['_apicem_perfil'] : 'reta';
		update_post_meta( $post_id, '_apicem_perfil', $perfil );
		update_post_meta( $post_id, '_apicem_imagem', absint( $_POST['_apicem_imagem'] ?? 0 ) );
		update_post_meta( $post_id, '_apicem_ativo',  isset( $_POST['_apicem_ativo'] ) ? '1' : '' );
	}

	// ── Acabamento ────────────────────────────────────────────────────────

	public static function render_acabamento( $post ) {
		wp_nonce_field( 'apicem_meta_' . $post->ID, '_apicem_nonce' );
		$hex     = get_post_meta( $post->ID, '_apicem_hex', true );
		$tipo    = get_post_meta( $post->ID, '_apicem_tipo', true );
		$textura = get_post_meta( $post->ID, '_apicem_textura', true );
		$ativo   = get_post_meta( $post->ID, '_apicem_ativo', true );
		$tex_url = $textura ? wp_get_attachment_thumb_url( $textura ) : '';
		?>
		<table class="form-table apicem-meta-table">
			<tr><th>Cor (hex)</th><td>
				<input type="color" name="_apicem_hex" value="<?php echo esc_attr( $hex ?: '#FFFFFF' ); ?>">
				<input type="text"  name="_apicem_hex_txt" value="<?php echo esc_attr( $hex ); ?>" class="small-text" style="width:90px;margin-left:6px" placeholder="#RRGGBB">
				<span class="description">Hex usado no swatch de UI (aproximação visual)</span>
			</td></tr>
			<tr><th>Tipo</th><td>
				<select name="_apicem_tipo">
					<option value="solido" <?php selected( $tipo, 'solido' ); ?>>Sólido</option>
					<option value="madeira" <?php selected( $tipo, 'madeira' ); ?>>Madeira (aplica textura de grão)</option>
				</select>
			</td></tr>
			<tr><th>Textura (opcional)</th><td>
				<input type="hidden" name="_apicem_textura" id="apicem_textura_id" value="<?php echo esc_attr( $textura ); ?>">
				<div id="apicem_textura_preview"><?php if ( $tex_url ) echo '<img src="' . esc_url( $tex_url ) . '" style="max-width:120px;display:block;margin-bottom:6px">'; ?></div>
				<button type="button" class="button apicem-media-btn" data-target="apicem_textura_id" data-preview="apicem_textura_preview">Selecionar textura</button>
				<?php if ( $textura ) : ?><button type="button" class="button apicem-media-remove" data-target="apicem_textura_id" data-preview="apicem_textura_preview">Remover</button><?php endif; ?>
			</td></tr>
			<tr><th>Ativo</th><td><input type="checkbox" name="_apicem_ativo" value="1" <?php checked( $ativo, '1' ); ?>></td></tr>
		</table>
		<?php
	}

	private static function save_acabamento( $post_id ) {
		$hex = sanitize_hex_color( $_POST['_apicem_hex'] ?? '' );
		if ( ! $hex ) $hex = sanitize_hex_color( '#' . ltrim( sanitize_text_field( $_POST['_apicem_hex_txt'] ?? '' ), '#' ) );
		update_post_meta( $post_id, '_apicem_hex',     $hex );
		$tipos = [ 'madeira', 'solido' ];
		$tipo  = in_array( $_POST['_apicem_tipo'] ?? '', $tipos, true ) ? $_POST['_apicem_tipo'] : 'solido';
		update_post_meta( $post_id, '_apicem_tipo',    $tipo );
		update_post_meta( $post_id, '_apicem_textura', absint( $_POST['_apicem_textura'] ?? 0 ) );
		update_post_meta( $post_id, '_apicem_ativo',   isset( $_POST['_apicem_ativo'] ) ? '1' : '' );
	}
}
