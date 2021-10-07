<template id="n-form-image-uploader">
	<n-form-section class="n-form-image-uploader n-form-file-uploader n-form-component" ref="form" 
		:class="{'has-selected': selectedImage != null, 'has-no-selected': selectedImage == null, 'read-only': readOnly, 'n-form-valid': valid != null && valid, 'n-form-invalid': valid != null && !valid, 'n-form-input-optional': !field.minimum, 'n-form-input-mandatory': field.minimum != null && field.minimum > 1, 'n-form-file-uploader-single': singular, 'n-form-file-uploader-multiple': !singular, 'n-form-file-uploader-mixed': field.allowNonImages }">
		<div class="n-form-label-wrapper">
			<label class="n-form-label" v-if="field.label">{{$services.page.translate(field.label)}}</label>
		</div>
		<n-input-file :types='fileTypes' ref='form' :amount='remaining > 1 ? remaining : 1'
			@change='changed'
			:value='files'
			:name='field.name'
			:dropLabel='field.dropLabel ? $services.page.translate(field.dropLabel) : null'
			:browseLabel='field.browseLabel ? $services.page.translate(field.browseLabel) : null'
			:browseIcon='field.browseIcon'
			:deleteIcon='field.deleteIcon'
			:visualize-file-names="false"
			v-if="!readOnly"
			/>
		<div v-else-if="field.showLargeSelectedReadOnly" class="selected-image-big selected-file-big">
			<img v-if="selectedImage && selectedImage[typeField].indexOf('image/') == 0" :src="selectedImage.$url" />
			<div v-else-if="selectedImage" class="description">{{selectedImage[nameField]}}</div>
		</div>
		<div v-else class="file-empty">
			<img v-else-if="field.emptyImage" :src="field.emptyImage"/>
			<div v-else-if="field.emptyText" class="no-data">{{$services.page.translate(field.emptyText)}}</div>
		</div>
		<div class="n-form-image-uploader-entries n-form-file-uploader-entries" v-if="!singular">
			<div v-for="(image, index) in actualValue[field.name]" class="image n-form-image-uploader-entry n-form-file-uploader-entry">
				<img v-if="image[typeField].indexOf('image/') == 0" :src="image.$url" @click="selectedImage = image" :class="{'selected-image-small': selectedImage == image, 'selected-file-small': selectedImage == image}"/>
				<span class="file-name">{{image[nameField]}}</span>
				<span class="delete-icon" @click="remove(index)" v-if="!readOnly">
					<!--<html-fragment :html="$services.page.getIconHtml('times')"></html-fragment>-->
					<span class="icon icon-close"></span>
				</span>
			</div>
		</div>
		<div class="n-form-image-uploader-entries n-form-file-uploader-entries" v-else-if="!readOnly">
			<div class="image n-form-image-uploader-entry n-form-file-uploader-entry" v-if="actualValue[field.name] && actualValue[field.name].$url">
				<img v-if="actualValue[field.name][typeField].indexOf('image/') == 0" :src="actualValue[field.name].$url" />
				<span class="file-name">{{actualValue[field.name][nameField]}}</span>
				<span class="delete-icon" @click="remove()" v-if="!readOnly">
					<!--<html-fragment :html="$services.page.getIconHtml('times')"></html-fragment>-->
					<span class="icon icon-close"></span>
				</span>
			</div>
		</div> 
		<n-messages :messages="messages"/>
	</n-form-section>
</template>

<template id="n-form-image-uploader-configure">
	<div>
		<n-form-text placeholder="1024" v-model="field.maxResolution" label="Maximum pixel dimension" info="This defaults to 1024, if you want unlimited pictures, set to 0" :timeout="600"/>
		<n-form-text label='Label drop' v-model='field.dropLabel' :timeout="600"/>
		<n-form-text label='Label browse' v-model='field.browseLabel' :timeout="600"/>
		<n-form-text label='Icon browse' v-model='field.browseIcon' :timeout="600"/>
		<n-form-text label='Minimum amount' v-model='field.minimum' :timeout="600"/>
		<n-form-text label='Maximum amount' v-model='field.maximum' :timeout="600"/>
		<n-form-text v-if="!field.emptyText" label='Empty read-only placeholder image' v-model='field.emptyImage' info="The image to show in the main spot when in read-only mode if none has been selected" :timeout="600"/>
		<n-form-text v-if="!field.emptyImage" label='Empty read-only placeholder text' v-model='field.emptyText' info="The text to show in the main spot when in read-only mode if none has been selected" :timeout="600"/>
		<n-form-switch label="Allow non-image files" v-model="field.allowNonImages"/>
		<n-form-switch label="Show large selected in read-only mode" v-model="field.showLargeSelectedReadOnly"/>
	</div>
</template> 