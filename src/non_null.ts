export class NonNull<T> {
	public constructor(private pointer: T) {}

	public static new_unchecked<T>(pointer: T): NonNull<T> {
		return new this(pointer);
	}

	public as_ref(): T {
		return this.pointer;
	}
}
