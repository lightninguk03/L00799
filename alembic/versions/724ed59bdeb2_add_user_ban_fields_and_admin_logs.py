"""add user ban fields and admin logs

Revision ID: 724ed59bdeb2
Revises: 
Create Date: 2025-12-13 19:37:53.111871

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '724ed59bdeb2'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 添加用户封禁字段
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_banned', sa.Boolean(), nullable=True, server_default='0'))
        batch_op.add_column(sa.Column('ban_reason', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('banned_until', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('banned_until')
        batch_op.drop_column('ban_reason')
        batch_op.drop_column('is_banned')
