Vue.component("n-form-image-uploader-configure", {
	template: "#n-form-image-uploader-configure",
	props: {
		cell: {
			type: Object,
			required: true
		},
		page: {
			type: Object,
			required: true
		},
		// the fragment this image is in
		field: {
			type: Object,
			required: true
		}
	}
});
Vue.component("n-form-image-uploader", {
	template: "#n-form-image-uploader",
	props: {
		cell: {
			type: Object,
			required: true
		},
		page: {
			type: Object,
			required: true
		},
		field: {
			type: Object,
			required: true
		},
		value: {
			required: true
		},
		parentValue: {
			required: false
		},
		timeout: {
			required: false
		},
		disabled: {
			type: Boolean,
			required: false
		},
		schema: {
			type: Object,
			required: false
		},
		edit: {
			type: Boolean,
			required: false
		},
		name: {
			type: String,
			required: false
		},
		readOnly: {
			type: Boolean,
			required: false,
			default: false
		},
		contentField: {
			type: String,
			default: "content"
		},
		nameField: {
			type: String,
			default: "contentName"
		},
		typeField: {
			type: String,
			default: "contentType"
		}
	},
	data: function() {
		return {
			files: [],
			fileTypes: [],
			// the files that are being worked on
			working: [],
			messages: [],
			selectedImage: null,
			// this component supports both arrays and singular elements
			// this boolean keeps track of the type
			singular: false
		}
	},
	computed: {
		actualValue: function() {
			// this started  as a batch component and was retrofitted to a singular component
			// the retrofitting was frustrating to get to work and this is likely _not_ the best solution but it does work
			if (this.singular) {
				var result = {};
				result[this.field.name] = {};
				result[this.field.name][this.contentField] = this.parentValue[this.field.name + "." + this.contentField];
				result[this.field.name][this.nameField] = this.parentValue[this.field.name + "." + this.nameField];
				result[this.field.name][this.typeField] = this.parentValue[this.field.name + "." + this.typeField];
				result[this.field.name]["$url"] = this.parentValue[this.field.name + ".$url"];
				return result;
			}
			else {
				return this.value;
			}
		},
		remaining: function() {
			var maximum = this.field.maximum ? parseInt(this.field.maximum) : null;
			if (maximum == null) {
				return null;
			}
			var storedAmount = this.singular
				? (this.actualValue[this.field.name].content != null ? 1 : 0)
				: this.actualValue[this.field.name].length;
			return maximum - this.files.length + storedAmount;
		}
	},
	created: function() {
		if (!this.field.hasOwnProperty("showLargeSelectedReadOnly")) {
			Vue.set(this.field, "showLargeSelectedReadOnly", true);
		}
		var self = this;
		// singular elements get the parent value which is the same as the value in list components
		this.singular = this.parentValue != null;
		if (this.singular) {
			if (!this.parentValue[this.field.name]) {
				Vue.set(this.parentValue, this.field.name, {});	
			}
		}
		else {
			if (!this.value[this.field.name]) {
				Vue.set(this.value, this.field.name, []);
			}
		}
		this.processImages(this.actualValue[this.field.name]);
		// by default this is only an image uploader
		if (!this.field.allowNonImages) {
			nabu.utils.arrays.merge(this.fileTypes, ["image/jpeg", "image/png", "image/svg+xml"]);
		}
	},
	methods: {
		validate: function(soft) {
			var minimum = this.field.minimum ? parseInt(this.field.minimum) : null;
			var messages = [];
			var storedAmount = this.singular
				? (this.actualValue[this.field.name].content != null ? 1 : 0)
				: this.actualValue[this.field.name].length;
			if (minimum != null && this.files.length + storedAmount < minimum) {
				messages.push({
					severity: "error",
					code: "not-enough-files",
					title: "%{You need to add at least {minimum} image(s)}", 
					values: {
						minimum: minimum
					}
				});
			}
			this.valid = messages.length == 0;
			nabu.utils.arrays.merge(this.messages, nabu.utils.vue.form.localMessages(this, messages));
			return messages;
		},
		changed: function() {
			var self = this;
			this.messages.splice(0);
			this.valid = null;
			var maximum = this.field.maximum ? parseInt(this.field.maximum) : null;
			var storedAmount = this.singular
				? (this.actualValue[this.field.name].content != null ? 1 : 0)
				: this.actualValue[this.field.name].length;
			if (maximum != null && this.files.length + storedAmount + this.working.length > maximum) {
				this.messages.push({
					severity: "info",
					code: "too-many-files",
					title: "%{You can only add {maximum} images}", 
					values: {
						maximum: maximum
					}
				});
			}
			else {
				this.files.forEach(function(file) {
					// not yet busy with it
					if (self.working.indexOf(file) < 0) {
						self.working.push(file);
						self.resizeAndAdd(file);
					}
				});
			}
			this.files.splice(0);
		},
		remove: function(index) {
			var self = this;
			if (this.singular) {
				// set everything to null
				self.parentValue[self.field.name + "." + self.nameField] = null;
				self.parentValue[self.field.name + "." + self.typeField] = null;
				self.parentValue[self.field.name + "." + self.contentField] = null;
				self.parentValue[self.field.name + ".$url"] = null;
				this.selectedImage = null;
			}
			else {
				if (this.selectedImage == this.actualValue[this.field.name][index]) {
					this.selectedImage = null;
				}
				this.actualValue[this.field.name].splice(index, 1);
			}
			this.messages.splice(0);
			this.valid = null;
			this.$emit("changed");
		},
		resizeAndAdd: function(file) {
			var self = this;
			var reader = new FileReader();
			reader.onload = function(readerEvent) {
				var applyUrl = function(dataUrl) {
					var result = self.singular ? self.actualValue[self.field.name] : {};
					result["$url"] = dataUrl;
					result[self.contentField] = self.urlToBlob(dataUrl);
					result[self.nameField] = file.name;
					result[self.typeField] = file.type ? file.type : (self.field.allowNonImages ? "application/octet-stream" : "image/jpeg");
					if (!self.singular) {
						self.actualValue[self.field.name].push(result);
					}
					else {
						self.parentValue[self.field.name + "." + self.nameField] = result[self.nameField];
						self.parentValue[self.field.name + "." + self.typeField] = result[self.typeField];
						self.parentValue[self.field.name + "." + self.contentField] = result[self.contentField];
						self.parentValue[self.field.name + ".$url"] = result["$url"];
					}
					if (self.selectedImage == null) {
						self.selectedImage = result;
					}
					// splice it from the arrays
					var index = self.working.indexOf(file);
					if (index >= 0) {
						self.working.splice(index, 1);
					}
					self.$emit("changed");
				}
				if (file.type.indexOf("image/") == 0) {
					var image = new Image();
					image.onload = function (imageEvent) {
						var canvas = document.createElement('canvas');
						var maxSize = self.field.maxResolution ? parseInt(self.field.maxResolution) : 1024;
						var width = image.width;
						var height = image.height;
						if (maxSize != null && maxSize > 0) {
							if (width >= height && width > maxSize) {
								var factor = maxSize / width;
								height *= factor;
								width = maxSize;
							}
							else if (height > width && height > maxSize) {
								var factor = maxSize / height;
								width *= factor;
								height = maxSize;
							}
						}
						canvas.width = width;
						canvas.height = height;
						canvas.getContext('2d').drawImage(image, 0, 0, width, height);
						// try to retrieve as the original format
						var dataUrl = canvas.toDataURL(file.type ? file.type : "image/jpeg");
						applyUrl(dataUrl);
					};
					image.src = readerEvent.target.result;
				}
				else {
					applyUrl(readerEvent.target.result);
				}
			};
			reader.readAsDataURL(file);
		},
		urlToBlob: function(dataURL) {
			var BASE64_MARKER = ';base64,';
			if (dataURL.indexOf(BASE64_MARKER) < 0) {
				var parts = dataURL.split(',');
				var contentType = parts[0].split(':')[1];
				var raw = parts[1];
				return new Blob([raw], {type: contentType});
			}
			else {
				var parts = dataURL.split(BASE64_MARKER);
				var contentType = parts[0].split(':')[1];
				return this.base64ToBlob(parts[1], contentType);
			}
		},
		base64ToBlob: function(base, contentType) {
			var raw = window.atob(base);
			var rawLength = raw.length;
			var uInt8Array = new Uint8Array(rawLength);
			for (var i = 0; i < rawLength; ++i) {
				uInt8Array[i] = raw.charCodeAt(i);
			}
			return new Blob([uInt8Array], {type: contentType});
		},
		processImages: function(imagesToProcess) {
			var self = this;
			if (!(imagesToProcess instanceof Array)) {
				imagesToProcess = [imagesToProcess];
			}
			imagesToProcess.forEach(function(image) {
				// if our content is already base64 encoded, it is likely from the backend
				if (image.$url == null && image[self.contentField] != null && typeof(image[self.contentField]) == "string") {
					image.$url = "data:" + image[self.typeField] + ";base64," + image[self.contentField];
					image[self.contentField] = self.base64ToBlob(image[self.contentField], image[self.typeField]);
					if (self.selectedImage == null) {
						self.selectedImage = image;
					}
				}
				else if (image.$url == null && image[self.contentField] != null && image[self.contentField] instanceof Blob) {
					var reader = new FileReader();
					reader.onload = function(event) { 
						Vue.set(image, "$url", event.target.result);
					}
					reader.readAsDataURL(image[self.contentField]);
					if (self.selectedImage == null) {
						self.selectedImage = image;
					}
				}
				else if (image.$url != null && self.selectedImage == null) {
					self.selectedImage = image;
				}
			});
		}
	}
});

window.addEventListener("load", function() {
	application.bootstrap(function($services) {
		nabu.page.provide("page-form-list-input", { 
			component: "n-form-image-uploader", 
			configure: "n-form-image-uploader-configure", 
			name: "image-uploader",
			namespace: "nabu.page"
		});
		nabu.page.provide("page-form-input", { 
			component: "n-form-image-uploader", 
			configure: "n-form-image-uploader-configure", 
			name: "image-uploader",
			namespace: "nabu.page"
		});
	});
	
});