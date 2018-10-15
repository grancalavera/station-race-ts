import * as React from "react";

interface KeyboardProps {
  onLeft: () => void;
  onRight: () => void;
  onShiftLeft: () => void;
  onShiftRight: () => void;
  onEnter: () => void;
  onShiftEnter: () => void;
}

export default class Keyboard extends React.Component<KeyboardProps> {
  public static defaultProps: KeyboardProps = {
    onEnter: () => {},
    onLeft: () => {},
    onRight: () => {},
    onShiftEnter: () => {},
    onShiftLeft: () => {},
    onShiftRight: () => {}
  };

  constructor(props: KeyboardProps) {
    super(props);
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  public handleKeydown(e: KeyboardEvent): void {
    const { shiftKey, key } = e;
    switch (shiftKey ? `Shift${key}` : key) {
      case "ArrowLeft":
        e.preventDefault();
        this.props.onLeft();
        break;
      case "ArrowRight":
        e.preventDefault();
        this.props.onRight();
        break;
      case "ShiftArrowLeft":
        e.preventDefault();
        this.props.onShiftLeft();
        break;
      case "ShiftArrowRight":
        e.preventDefault();
        this.props.onShiftRight();
        break;
      case "Enter":
        e.preventDefault();
        this.props.onEnter();
        break;
      case "ShiftEnter":
        e.preventDefault();
        this.props.onShiftEnter();
        break;
      default:
    }
  }

  public render() {
    return null;
  }

  public componentDidMount() {
    document.addEventListener("keydown", this.handleKeydown);
  }

  public componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeydown);
  }
}
