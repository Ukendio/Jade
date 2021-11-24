export class NonNull<T> {
	private pointer;
	public constructor(pointer: T) {
		this.pointer = pointer;
	}

	public static new_unchecked<T>(pointer: T): NonNull<T> {
		return new this(pointer);
	}

	public as_ref(): T {
		return this.pointer;
	}
}
