export class NonNull<T> {
	private pointer;
	public constructor(pointer: T) {
		this.pointer = pointer;
	}

	static new_unchecked<T>(pointer: T) {
		return new this(pointer);
	}

	public as_ref(): T {
		return this.pointer;
	}
}
